import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/lms_repository.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'lesson_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  final _repo = LMSRepository();
  final _search = TextEditingController();
  late Future<_LibraryData> _future;
  String? _topicId;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<_LibraryData> _load() async {
    final topics = await _repo.fetchTopics();
    final lessons = await _repo.fetchLessons();
    return _LibraryData(topics: topics, lessons: lessons);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Library')),
      body: FutureBuilder<_LibraryData>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data!;
          if (data.lessons.isEmpty) {
            return const EmptyView(
              icon: Icons.folder_open_outlined,
              title: 'Library is empty',
              subtitle:
                  'Session recordings will be organized by CFA topic once they’re added.',
            );
          }

          final query = _search.text.trim().toLowerCase();
          final filtered = data.lessons.where((lesson) {
            final matchesTopic =
                _topicId == null || lesson.topicId == _topicId;
            final matchesSearch = query.isEmpty ||
                lesson.title.toLowerCase().contains(query) ||
                (lesson.description?.toLowerCase().contains(query) ?? false);
            return matchesTopic && matchesSearch;
          }).toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                child: TextField(
                  controller: _search,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Search by title…',
                  ),
                ),
              ),
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _TopicChip(
                      label: 'All',
                      selected: _topicId == null,
                      onTap: () => setState(() => _topicId = null),
                    ),
                    ...data.topics.map(
                      (topic) => _TopicChip(
                        label: topic.name,
                        selected: _topicId == topic.id,
                        onTap: () => setState(() => _topicId = topic.id),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: filtered.isEmpty
                    ? EmptyView(
                        icon: Icons.search_off,
                        title: 'No results',
                        subtitle: 'Try a different search or clear filters.',
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final lesson = filtered[index];
                          return LessonTile(
                            lesson: lesson,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      LessonScreen(lessonId: lesson.id),
                                ),
                              );
                            },
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

class _TopicChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _TopicChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.navy.withValues(alpha: 0.12),
        labelStyle: TextStyle(
          color: selected ? AppColors.navy : AppColors.slate,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _LibraryData {
  final List<Topic> topics;
  final List<Lesson> lessons;
  _LibraryData({required this.topics, required this.lessons});
}
