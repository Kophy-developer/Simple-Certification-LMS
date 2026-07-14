import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';

class ProgressApi {
  Future<void> sync({
    required String lessonId,
    required String partId,
    required int watchedSeconds,
    required bool completed,
  }) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    await http.post(
      Uri.parse('${AppConfig.apiUrl}/api/progress'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${session.accessToken}',
      },
      body: jsonEncode({
        'lessonId': lessonId,
        'partId': partId,
        'watchedSeconds': watchedSeconds,
        'completed': completed,
      }),
    );
  }

  String streamUrl(String partId) =>
      '${AppConfig.apiUrl}/api/stream/part/$partId';
}
