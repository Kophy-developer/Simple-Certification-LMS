class Topic {
  final String id;
  final String name;
  final int sortOrder;

  Topic({required this.id, required this.name, required this.sortOrder});

  factory Topic.fromJson(Map<String, dynamic> json) => Topic(
        id: json['id'] as String,
        name: json['name'] as String,
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class LessonPart {
  final String id;
  final String lessonId;
  final String title;
  final String driveFileId;
  final String driveUrl;
  final int sortOrder;
  final int? durationSeconds;

  LessonPart({
    required this.id,
    required this.lessonId,
    required this.title,
    required this.driveFileId,
    required this.driveUrl,
    required this.sortOrder,
    this.durationSeconds,
  });

  factory LessonPart.fromJson(Map<String, dynamic> json) => LessonPart(
        id: json['id'] as String,
        lessonId: json['lesson_id'] as String,
        title: json['title'] as String? ?? 'Part',
        driveFileId: json['drive_file_id'] as String,
        driveUrl: json['drive_url'] as String? ?? '',
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 1,
        durationSeconds: (json['duration_seconds'] as num?)?.toInt(),
      );

  String get previewUrl =>
      'https://drive.google.com/file/d/$driveFileId/preview';
}

class Lesson {
  final String id;
  final String title;
  final String? description;
  final String topicId;
  final String sessionDate;
  final Topic? topic;
  final List<LessonPart> parts;

  Lesson({
    required this.id,
    required this.title,
    required this.topicId,
    required this.sessionDate,
    this.description,
    this.topic,
    this.parts = const [],
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    Topic? topic;
    final topics = json['topics'];
    if (topics is Map<String, dynamic>) {
      topic = Topic(
        id: topics['id'] as String,
        name: topics['name'] as String,
        sortOrder: 0,
      );
    }

    final rawParts = json['lesson_parts'];
    final parts = rawParts is List
        ? rawParts
            .whereType<Map<String, dynamic>>()
            .map(LessonPart.fromJson)
            .toList()
        : <LessonPart>[];
    parts.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    return Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      topicId: json['topic_id'] as String,
      sessionDate: json['session_date'] as String,
      topic: topic,
      parts: parts,
    );
  }
}

class ProgressRow {
  final String id;
  final String lessonId;
  final String? lessonPartId;
  final int watchedSeconds;
  final bool completed;
  final String lastWatchedAt;

  ProgressRow({
    required this.id,
    required this.lessonId,
    required this.watchedSeconds,
    required this.completed,
    required this.lastWatchedAt,
    this.lessonPartId,
  });

  factory ProgressRow.fromJson(Map<String, dynamic> json) => ProgressRow(
        id: json['id'] as String,
        lessonId: json['lesson_id'] as String,
        lessonPartId: json['lesson_part_id'] as String?,
        watchedSeconds: (json['watched_seconds'] as num?)?.toInt() ?? 0,
        completed: json['completed'] as bool? ?? false,
        lastWatchedAt: json['last_watched_at'] as String? ?? '',
      );
}

class Profile {
  final String id;
  final String name;
  final String email;
  final String role;

  Profile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
        role: json['role'] as String? ?? 'student',
      );
}
