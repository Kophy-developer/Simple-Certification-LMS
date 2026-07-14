import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:video_player/video_player.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../models/models.dart';
import '../services/progress_api.dart';
import '../theme.dart';

class PartVideoPlayer extends StatefulWidget {
  final Lesson lesson;
  final LessonPart part;
  final int initialPosition;
  final VoidCallback? onCompleted;

  const PartVideoPlayer({
    super.key,
    required this.lesson,
    required this.part,
    this.initialPosition = 0,
    this.onCompleted,
  });

  @override
  State<PartVideoPlayer> createState() => _PartVideoPlayerState();
}

class _PartVideoPlayerState extends State<PartVideoPlayer> {
  final _api = ProgressApi();
  VideoPlayerController? _controller;
  WebViewController? _webController;
  bool _loading = true;
  bool _usePreview = false;
  String? _error;
  DateTime _lastSync = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  @override
  void didUpdateWidget(covariant PartVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.part.id != widget.part.id) {
      _disposePlayer();
      _usePreview = false;
      _error = null;
      _loading = true;
      _initPlayer();
    }
  }

  Future<void> _initPlayer() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      setState(() {
        _error = 'Please sign in again.';
        _loading = false;
      });
      return;
    }

    final controller = VideoPlayerController.networkUrl(
      Uri.parse(_api.streamUrl(widget.part.id)),
      httpHeaders: {'Authorization': 'Bearer ${session.accessToken}'},
    );

    try {
      await controller.initialize();
      if (widget.initialPosition > 0) {
        await controller.seekTo(Duration(seconds: widget.initialPosition));
      }
      controller.addListener(_onTick);
      await controller.play();
      if (!mounted) return;
      setState(() {
        _controller = controller;
        _loading = false;
      });
    } catch (_) {
      await controller.dispose();
      if (!mounted) return;
      _openPreview();
    }
  }

  void _openPreview() {
    final web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(widget.part.previewUrl));
    setState(() {
      _usePreview = true;
      _webController = web;
      _loading = false;
      _error = null;
    });
  }

  void _onTick() {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    final position = controller.value.position.inSeconds;
    final duration = controller.value.duration.inSeconds;
    final completed = duration > 0 && position / duration >= 0.95;
    final now = DateTime.now();

    if (now.difference(_lastSync).inSeconds >= 10 ||
        controller.value.isPlaying == false ||
        completed) {
      _lastSync = now;
      _api.sync(
        lessonId: widget.lesson.id,
        partId: widget.part.id,
        watchedSeconds: position,
        completed: completed,
      );
      if (completed) widget.onCompleted?.call();
    }
  }

  void _disposePlayer() {
    _controller?.removeListener(_onTick);
    _controller?.dispose();
    _controller = null;
  }

  @override
  void dispose() {
    final controller = _controller;
    if (controller != null && controller.value.isInitialized) {
      final position = controller.value.position.inSeconds;
      final duration = controller.value.duration.inSeconds;
      _api.sync(
        lessonId: widget.lesson.id,
        partId: widget.part.id,
        watchedSeconds: position,
        completed: duration > 0 && position / duration >= 0.95,
      );
    }
    _disposePlayer();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
      );
    }

    if (_usePreview && _webController != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: WebViewWidget(controller: _webController!),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Playing via Google Drive preview.',
            style: TextStyle(color: AppColors.slate, fontSize: 12),
          ),
        ],
      );
    }

    if (_error != null || _controller == null) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.navy.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error ?? 'Unable to play this recording.'),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _openPreview,
                  child: const Text('Open Drive preview'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final controller = _controller!;
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: AspectRatio(
        aspectRatio: controller.value.aspectRatio == 0
            ? 16 / 9
            : controller.value.aspectRatio,
        child: Stack(
          alignment: Alignment.bottomCenter,
          children: [
            VideoPlayer(controller),
            _Controls(controller: controller),
          ],
        ),
      ),
    );
  }
}

class _Controls extends StatelessWidget {
  final VideoPlayerController controller;
  const _Controls({required this.controller});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        return Container(
          color: Colors.black.withValues(alpha: 0.35),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            children: [
              IconButton(
                color: Colors.white,
                onPressed: () {
                  if (controller.value.isPlaying) {
                    controller.pause();
                  } else {
                    controller.play();
                  }
                },
                icon: Icon(
                  controller.value.isPlaying
                      ? Icons.pause_rounded
                      : Icons.play_arrow_rounded,
                ),
              ),
              Expanded(
                child: VideoProgressIndicator(
                  controller,
                  allowScrubbing: true,
                  colors: const VideoProgressColors(
                    playedColor: AppColors.accent,
                    bufferedColor: Colors.white38,
                    backgroundColor: Colors.white24,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
