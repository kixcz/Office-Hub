<?php

use App\Http\Controllers\AccomplishmentController;
use App\Http\Controllers\Administration\AcademicPeriodController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ClassroomMonitoringController;
use App\Http\Controllers\Compliance\ComplianceTrackerController;
use App\Http\Controllers\Compliance\PendingOutputController;
use App\Http\Controllers\Compliance\RequirementController;
use App\Http\Controllers\Compliance\SubmissionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentRouteController;
use App\Http\Controllers\Faculty\WorkspaceController;
use App\Http\Controllers\FacultyAttendanceController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\OfficeRequestController;
use App\Http\Controllers\Performance\FacultyPerformanceController;
use App\Http\Controllers\Performance\ProgramPerformanceController;
use App\Http\Controllers\Performance\RecognitionRuleController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\Schedule\AcademicCalendarImportController;
use App\Http\Controllers\Schedule\ActivityController;
use App\Http\Controllers\Schedule\CalendarController;
use App\Http\Controllers\Schedule\MeetingController;
use App\Http\Controllers\Schedule\SemesterScheduleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\Tv\PlaylistController;
use App\Http\Controllers\Tv\SettingController;
use App\Http\Controllers\Tv\SlideController;
use App\Http\Controllers\TvDisplayController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/tv-display', [TvDisplayController::class, 'index'])->name('tv-display');
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('requests', OfficeRequestController::class)->only(['index', 'store', 'update']);
    Route::resource('announcements', AnnouncementController::class);

    // Compliance Section
    Route::prefix('compliance')->name('compliance.')->group(function () {
        Route::resource('requirements', RequirementController::class);
        Route::post('submissions/bulk-record', [SubmissionController::class, 'bulkRecord'])->name('submissions.bulk-record');
        Route::resource('submissions', SubmissionController::class);
        Route::get('pending-outputs', [PendingOutputController::class, 'index'])->name('pending-outputs.index');
        Route::get('tracker', [ComplianceTrackerController::class, 'index'])->name('tracker.index');
    });

    // Schedule Section
    Route::prefix('schedule')->name('schedule.')->group(function () {
        Route::resource('meetings', MeetingController::class);
        Route::resource('activities', ActivityController::class);
        Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');
        Route::get('calendar/events-json', [CalendarController::class, 'eventsJson'])->name('calendar.events-json');
        Route::post('calendar', [CalendarController::class, 'store'])->name('calendar.store');
        Route::delete('calendar/{id}', [CalendarController::class, 'destroy'])->name('calendar.destroy');

        // Academic Calendar Import (AI Ingestion & Validation Workflow)
        Route::get('calendar-import', [AcademicCalendarImportController::class, 'index'])->name('calendar.import');
        Route::post('calendar-import/upload', [AcademicCalendarImportController::class, 'upload'])->name('calendar.import.upload');
        Route::post('calendar-import/approve/{event}', [AcademicCalendarImportController::class, 'approveEvent'])->name('calendar.import.approve');
        Route::post('calendar-import/bulk-approve', [AcademicCalendarImportController::class, 'bulkApprove'])->name('calendar.import.bulk-approve');
        Route::post('calendar-import/reject/{event}', [AcademicCalendarImportController::class, 'rejectEvent'])->name('calendar.import.reject');
        Route::delete('calendar-import/event/{event}', [AcademicCalendarImportController::class, 'deleteEvent'])->name('calendar.import.delete-event');
        Route::put('calendar-import/event/{event}', [AcademicCalendarImportController::class, 'updateEvent'])->name('calendar.import.update-event');
        Route::put('calendar-import/rule/{rule}', [AcademicCalendarImportController::class, 'updateRule'])->name('calendar.import.update-rule');
        Route::post('calendar-import/batch/{batch}/rollback', [AcademicCalendarImportController::class, 'rollbackBatch'])->name('calendar.import.rollback');
        Route::post('calendar-import/batch/{batch}/reanalyze', [AcademicCalendarImportController::class, 'reanalyzeBatch'])->name('calendar.import.reanalyze');

        // Master Data Modules (Dedicated to Scheduling Workspace)
        Route::prefix('master-data')->name('master-data.')->group(function () {
            Route::get('academic-periods', [SemesterScheduleController::class, 'masterDataAcademicPeriods'])->name('academic-periods');
            Route::get('programs', [SemesterScheduleController::class, 'masterDataPrograms'])->name('programs');
            Route::get('faculty', [SemesterScheduleController::class, 'masterDataFaculty'])->name('faculty');
            Route::get('rooms', [SemesterScheduleController::class, 'masterDataRooms'])->name('rooms');
        });

        // Semester Schedule Generator System
        Route::get('generator', [SemesterScheduleController::class, 'generator'])->name('generator');
        Route::post('generator/import', [SemesterScheduleController::class, 'importAcademicData'])->name('generator.import');
        Route::post('generator/assign-faculty', [SemesterScheduleController::class, 'assignFaculty'])->name('generator.assign-faculty');
        Route::get('sections', [SemesterScheduleController::class, 'sectionsOfferings'])->name('sections');
        Route::get('loading', [SemesterScheduleController::class, 'facultyLoading'])->name('loading');
        Route::get('timetable', [SemesterScheduleController::class, 'timetable'])->name('timetable');
        Route::get('conflicts', [SemesterScheduleController::class, 'conflictCenter'])->name('conflicts');
        Route::get('reviews', [SemesterScheduleController::class, 'reviews'])->name('reviews');
        Route::get('master-timetable', [SemesterScheduleController::class, 'masterTimetable'])->name('master-timetable');
        Route::get('gemini', [SemesterScheduleController::class, 'geminiAssistant'])->name('gemini');
        Route::post('gemini/ask', [SemesterScheduleController::class, 'askGeminiAssistant'])->name('gemini.ask');
    });

    // Performance Section
    Route::prefix('performance')->name('performance.')->group(function () {
        Route::get('faculty', [FacultyPerformanceController::class, 'index'])->name('faculty');
        Route::get('faculty/report', [FacultyPerformanceController::class, 'report'])->name('faculty.report');
        Route::get('program', [ProgramPerformanceController::class, 'index'])->name('program');
        Route::resource('rules', RecognitionRuleController::class);
    });

    // TV Configuration Section
    Route::prefix('tv-config')->name('tv-config.')->group(function () {
        Route::get('playlist', [PlaylistController::class, 'index'])->name('playlist.index');
        Route::post('playlist', [PlaylistController::class, 'store'])->name('playlist.store');
        Route::post('playlist/reorder', [PlaylistController::class, 'reorder'])->name('playlist.reorder');
        Route::put('playlist/{playlist}', [PlaylistController::class, 'update'])->name('playlist.update');
        Route::delete('playlist/{playlist}', [PlaylistController::class, 'destroy'])->name('playlist.destroy');

        Route::get('slides', [SlideController::class, 'index'])->name('slides.index');
        Route::get('slides/builder', [SlideController::class, 'builder'])->name('slides.builder');
        Route::get('slides/{slide}/edit', [SlideController::class, 'edit'])->name('slides.edit');
        Route::put('slides/{slide}', [SlideController::class, 'update'])->name('slides.update');

        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [SettingController::class, 'store'])->name('settings.store');
        Route::post('settings/reset', [SettingController::class, 'reset'])->name('settings.reset');
    });

    // Classroom Monitoring
    Route::get('/classroom-monitoring', [ClassroomMonitoringController::class, 'index'])->name('classroom-monitoring.index');
    Route::post('/classroom-monitoring/sync', [ClassroomMonitoringController::class, 'sync'])->name('classroom-monitoring.sync');
    Route::post('/classroom-monitoring/schedules/{schedule}/link-faculty', [ClassroomMonitoringController::class, 'linkFaculty'])->name('classroom-monitoring.link-faculty');

    // Faculty Attendance & Monitoring
    Route::prefix('faculty-attendance')->name('faculty-attendance.')->group(function () {
        Route::get('/', [FacultyAttendanceController::class, 'index'])->name('index');
        Route::get('/report', [FacultyAttendanceController::class, 'report'])->name('report');
        Route::post('/sync', [FacultyAttendanceController::class, 'sync'])->name('sync');
        Route::post('/link-faculty', [FacultyAttendanceController::class, 'linkFaculty'])->name('link-faculty');
    });

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    // Accomplishments
    Route::get('/accomplishments', [AccomplishmentController::class, 'index'])->name('accomplishments.index');
    Route::post('/accomplishments', [AccomplishmentController::class, 'store'])->name('accomplishments.store');
    // Document Routing
    Route::get('/documents', [DocumentRouteController::class, 'index'])->name('documents.index');
    Route::post('/documents', [DocumentRouteController::class, 'store'])->name('documents.store');
    Route::patch('/documents/{document}', [DocumentRouteController::class, 'update'])->name('documents.update');

    // Programs & Faculties
    Route::resource('programs', ProgramController::class);
    Route::resource('faculties', FacultyController::class);

    // Faculty Workspace
    Route::get('/faculty/workspace', [WorkspaceController::class, 'index'])->name('faculty.workspace');

    // Administration -> Academic Periods
    Route::prefix('administration/academic-periods')->name('administration.academic-periods.')->group(function () {
        Route::get('/', [AcademicPeriodController::class, 'index'])->name('index');
        Route::post('/', [AcademicPeriodController::class, 'store'])->name('store');
        Route::put('/{academicPeriod}', [AcademicPeriodController::class, 'update'])->name('update');
        Route::post('/{academicPeriod}/activate', [AcademicPeriodController::class, 'activate'])->name('activate');
        Route::post('/{academicPeriod}/close', [AcademicPeriodController::class, 'close'])->name('close');
        Route::post('/{academicPeriod}/archive', [AcademicPeriodController::class, 'archive'])->name('archive');
        Route::post('/{academicPeriod}/duplicate', [AcademicPeriodController::class, 'duplicateSetup'])->name('duplicate');
        Route::delete('/{academicPeriod}', [AcademicPeriodController::class, 'destroy'])->name('destroy');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
