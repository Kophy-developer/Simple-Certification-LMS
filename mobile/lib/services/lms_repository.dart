import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';

class LMSRepository {
  SupabaseClient get _client => Supabase.instance.client;

  Future<Profile?> currentProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    final data = await _client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();
    if (data == null) return null;
    return Profile.fromJson(Map<String, dynamic>.from(data));
  }

  Future<List<Lesson>> fetchLessons() async {
    final data = await _client
        .from('lessons')
        .select('*, topics(id, name), lesson_parts(*)')
        .order('session_date', ascending: false);
    return (data as List)
        .map((e) => Lesson.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<List<Topic>> fetchTopics() async {
    final data =
        await _client.from('topics').select().order('sort_order');
    return (data as List)
        .map((e) => Topic.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<Lesson?> fetchLesson(String id) async {
    final data = await _client
        .from('lessons')
        .select('*, topics(id, name), lesson_parts(*)')
        .eq('id', id)
        .maybeSingle();
    if (data == null) return null;
    return Lesson.fromJson(Map<String, dynamic>.from(data));
  }

  Future<List<ProgressRow>> fetchProgressForUser(String userId) async {
    final data =
        await _client.from('progress').select().eq('user_id', userId);
    return (data as List)
        .map((e) => ProgressRow.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<List<ProgressRow>> fetchProgressForLesson(
    String userId,
    String lessonId,
  ) async {
    final data = await _client
        .from('progress')
        .select()
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);
    return (data as List)
        .map((e) => ProgressRow.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}
