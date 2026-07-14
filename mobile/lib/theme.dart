import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const navy = Color(0xFF1B2A4A);
  static const navySoft = Color(0xFF2C3E5F);
  static const accent = Color(0xFFC4A574);
  static const cream = Color(0xFFF7F6F3);
  static const slate = Color(0xFF5C6578);
  static const line = Color(0xFFE4E2DC);
}

ThemeData buildAppTheme({Brightness brightness = Brightness.light}) {
  final isDark = brightness == Brightness.dark;
  final base = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: ColorScheme(
      brightness: brightness,
      primary: isDark ? const Color(0xFF9BB0D4) : AppColors.navy,
      onPrimary: isDark ? AppColors.navy : Colors.white,
      secondary: AppColors.accent,
      onSecondary: AppColors.navy,
      error: const Color(0xFFB42318),
      onError: Colors.white,
      surface: isDark ? const Color(0xFF151A24) : Colors.white,
      onSurface: isDark ? const Color(0xFFF2F4F8) : AppColors.navy,
    ),
    scaffoldBackgroundColor: isDark ? const Color(0xFF0F131A) : AppColors.cream,
  );

  return base.copyWith(
    textTheme: GoogleFonts.dmSansTextTheme(base.textTheme).apply(
      bodyColor: isDark ? const Color(0xFFF2F4F8) : AppColors.navy,
      displayColor: isDark ? const Color(0xFFF2F4F8) : AppColors.navy,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.dmSans(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: isDark ? const Color(0xFFF2F4F8) : AppColors.navy,
      ),
      iconTheme: IconThemeData(
        color: isDark ? const Color(0xFFF2F4F8) : AppColors.navy,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isDark ? const Color(0xFF1B2230) : Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: isDark ? const Color(0xFF2C3548) : AppColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: isDark ? const Color(0xFF2C3548) : AppColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: isDark ? const Color(0xFF9BB0D4) : AppColors.navy,
          width: 1.4,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.dmSans(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    cardTheme: CardThemeData(
      color: isDark ? const Color(0xFF1B2230) : Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: isDark ? const Color(0xFF2C3548) : AppColors.line),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: isDark ? const Color(0xFF151A24) : Colors.white,
      indicatorColor: isDark
          ? const Color(0xFF9BB0D4).withValues(alpha: 0.18)
          : AppColors.navy.withValues(alpha: 0.1),
      labelTextStyle: WidgetStatePropertyAll(
        GoogleFonts.dmSans(fontSize: 12, fontWeight: FontWeight.w500),
      ),
    ),
  );
}
