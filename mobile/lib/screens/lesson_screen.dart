import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';
import '../services/lms_repository.dart';
import '../theme.dart';
import '../widgets/part_video_player.dart';

class LessonScreen extends StatefulWidget {
  final String lessonId;

  const LessonScreen({super.key, required this.lessonId});

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  final _repo = LMSRepository();
  late Future<_LessonData> _future;
  String? _activePartId;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_LessonData> _load() async {
    final user = Supabase.instance.client.auth.currentUser!;
    final lesson = await _repo.fetchLesson(widget.lessonId);
    if (lesson == null) {
      throw Exception('Lesson not found');
    }
    final progress =
        await _repo.fetchProgressForLesson(user.id, widget.lessonId);
    final byPart = <String, ProgressRow>{};
    for (final row in progress) {
      if (row.lessonPartId != null) {
        byPart[row.lessonPartId!] = row;
      }
    }
    return _LessonData(lesson: lesson, progressByPart: byPart);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lesson')),
      body: FutureBuilder<_LessonData>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data!;
          final lesson = data.lesson;
          if (lesson.parts.isEmpty) {
            return const Center(child: Text('This lesson has no video parts yet.'));
          }

          final activeId = _activePartId ??
              lesson.parts
                  .firstWhere(
                    (p) => !(data.progressByPart[p.id]?.completed ?? false),
                    orElse: () => lesson.parts.first,
                  )
                  .id;
          final activePart =
              lesson.parts.firstWhere((p) => p.id == activeId);
          final date = DateTime.tryParse(lesson.sessionDate);
          final dateLabel =
              date == null ? lesson.sessionDate : DateFormat.yMMMMd().format(date);

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              PartVideoPlayer(
                key: ValueKey(activePart.id),
                lesson: lesson,
                part: activePart,
                initialPosition:
                    data.progressByPart[activePart.id]?.watchedSeconds ?? 0,
              ),
              if (lesson.parts.length > 1) ...[
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: lesson.parts.map((part) {
                    final selected = part.id == activePart.id;
                    final done = data.progressByPart[part.id]?.completed ?? false;
                    return ChoiceChip(
                      selected: selected,
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (done) ...[
                            const Icon(Icons.check_circle, size: 14),
                            const SizedBox(width: 4),
                          ],
                          Text(part.title),
                        ],
                      ),
                      onSelected: (_) => setState(() => _activePartId = part.id),
                      selectedColor: AppColors.navy.withValues(alpha: 0.12),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 20),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (lesson.topic != null)
                    Chip(label: Text(lesson.topic!.name)),
                  if (lesson.parts.length > 1)
                    Chip(label: Text('${lesson.parts.length} parts')),
                  Text(dateLabel, style: const TextStyle(color: AppColors.slate)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                lesson.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              if (lesson.parts.length > 1) ...[
                const SizedBox(height: 6),
                Text(
                  'Now playing: ${activePart.title}',
                  style: const TextStyle(color: AppColors.slate),
                ),
              ],
              if (lesson.description != null &&
                  lesson.description!.trim().isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  lesson.description!,
                  style: const TextStyle(height: 1.45, color: AppColors.slate),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _LessonData {
  final Lesson lesson;
  final Map<String, ProgressRow> progressByPart;

  _LessonData({required this.lesson, required this.progressByPart});
}
