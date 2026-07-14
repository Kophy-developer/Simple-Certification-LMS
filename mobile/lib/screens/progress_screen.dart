import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';
import '../services/lms_repository.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'lesson_screen.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  final _repo = LMSRepository();
  late Future<_ProgressData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_ProgressData> _load() async {
    final user = Supabase.instance.client.auth.currentUser!;
    final lessons = await _repo.fetchLessons();
    final progress = await _repo.fetchProgressForUser(user.id);
    final profile = await _repo.currentProfile();

    final completedPartByLesson = <String, Set<String>>{};
    var watchSeconds = 0;
    for (final row in progress) {
      watchSeconds += row.watchedSeconds;
      if (row.completed && row.lessonPartId != null) {
        completedPartByLesson
            .putIfAbsent(row.lessonId, () => <String>{})
            .add(row.lessonPartId!);
      }
    }

    final completedLessons = <Lesson>[];
    for (final lesson in lessons) {
      if (lesson.parts.isEmpty) continue;
      final done = completedPartByLesson[lesson.id] ?? {};
      if (lesson.parts.every((p) => done.contains(p.id))) {
        completedLessons.add(lesson);
      }
    }

    return _ProgressData(
      profile: profile,
      totalLessons: lessons.length,
      completedCount: completedLessons.length,
      watchSeconds: watchSeconds,
      completedLessons: completedLessons,
    );
  }

  String _formatWatch(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    if (h > 0) return '${h}h ${m}m';
    return '${m}m';
  }

  Future<void> _logout() async {
    await Supabase.instance.client.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress'),
        actions: [
          IconButton(
            tooltip: 'Log out',
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: FutureBuilder<_ProgressData>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data!;
          final percent = data.totalLessons == 0
              ? 0.0
              : data.completedCount / data.totalLessons;

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              if (data.profile != null) ...[
                Text(
                  data.profile!.name,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                Text(
                  data.profile!.email,
                  style: const TextStyle(color: AppColors.slate),
                ),
                const SizedBox(height: 20),
              ],
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'Completed',
                      value: '${data.completedCount}/${data.totalLessons}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Watch time',
                      value: _formatWatch(data.watchSeconds),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Overall completion',
                          style: TextStyle(color: AppColors.slate)),
                      const SizedBox(height: 8),
                      Text(
                        '${(percent * 100).round()}%',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: percent,
                          minHeight: 8,
                          backgroundColor: AppColors.line,
                          color: AppColors.accent,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Completed lessons',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 12),
              if (data.completedLessons.isEmpty)
                const Text(
                  'Finish a lesson to see it here.',
                  style: TextStyle(color: AppColors.slate),
                )
              else
                ...data.completedLessons.map(
                  (lesson) => LessonTile(
                    lesson: lesson,
                    completed: true,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => LessonScreen(lessonId: lesson.id),
                        ),
                      );
                    },
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: AppColors.slate)),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressData {
  final Profile? profile;
  final int totalLessons;
  final int completedCount;
  final int watchSeconds;
  final List<Lesson> completedLessons;

  _ProgressData({
    required this.profile,
    required this.totalLessons,
    required this.completedCount,
    required this.watchSeconds,
    required this.completedLessons,
  });
}
