import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';
import '../services/lms_repository.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'lesson_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _repo = LMSRepository();
  late Future<_HomeData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_HomeData> _load() async {
    final user = Supabase.instance.client.auth.currentUser;
    final profile = await _repo.currentProfile();
    final lessons = await _repo.fetchLessons();
    final progress = user == null
        ? <ProgressRow>[]
        : await _repo.fetchProgressForUser(user.id);

    final inProgressIds = progress
        .where((p) => !p.completed && p.watchedSeconds > 0)
        .map((p) => p.lessonId)
        .toSet();

    final continueWatching =
        lessons.where((l) => inProgressIds.contains(l.id)).toList();
    final recent = lessons.take(6).toList();

    return _HomeData(
      name: profile?.name.split(' ').first ?? 'there',
      continueWatching: continueWatching,
      recent: recent,
      lessonsEmpty: lessons.isEmpty,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = _load());
          await _future;
        },
        child: FutureBuilder<_HomeData>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return EmptyView(
                icon: Icons.error_outline,
                title: 'Couldn’t load lessons',
                subtitle: snapshot.error.toString(),
              );
            }
            final data = snapshot.data!;
            if (data.lessonsEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyView(
                    icon: Icons.menu_book_outlined,
                    title: 'Nothing here yet',
                    subtitle:
                        'Your next session recording will show up right after class.',
                  ),
                ],
              );
            }

            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              children: [
                Text(
                  'Welcome back, ${data.name}',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Pick up where you left off or explore new recordings.',
                  style: TextStyle(color: AppColors.slate),
                ),
                const SizedBox(height: 28),
                Text(
                  'Continue watching',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),
                if (data.continueWatching.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.line),
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
                    child: const Text(
                      'Nothing in progress yet. Browse the library to start watching.',
                      style: TextStyle(color: AppColors.slate),
                    ),
                  )
                else
                  ...data.continueWatching.map(
                    (lesson) => LessonTile(
                      lesson: lesson,
                      onTap: () => _open(lesson),
                    ),
                  ),
                const SizedBox(height: 28),
                Text(
                  'Recently added',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),
                ...data.recent.map(
                  (lesson) => LessonTile(
                    lesson: lesson,
                    onTap: () => _open(lesson),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _open(Lesson lesson) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => LessonScreen(lessonId: lesson.id)),
    );
  }
}

class _HomeData {
  final String name;
  final List<Lesson> continueWatching;
  final List<Lesson> recent;
  final bool lessonsEmpty;

  _HomeData({
    required this.name,
    required this.continueWatching,
    required this.recent,
    required this.lessonsEmpty,
  });
}
