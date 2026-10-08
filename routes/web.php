<?php

use App\Http\Controllers\AccomplishmentController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ClassroomMonitoringController;
use App\Http\Controllers\Compliance\ComplianceTrackerController;
use App\Http\Controllers\Compliance\PendingOutputController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentRouteController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\OfficeRequestController;
use App\Http\Controllers\Performance\FacultyPerformanceController;
use App\Http\Controllers\Performance\ProgramPerformanceController;
use App\Http\Controllers\Performance\RecognitionRuleController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\Schedule\ActivityController;
use App\Http\Controllers\Schedule\CalendarController;
use App\Http\Controllers\Schedule\MeetingController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\Tv\PlaylistController;
use App\Http\Controllers\Tv\SettingController;
use App\Http\Controllers\Tv\SlideController;
use App\Http\Controllers\TvDisplayController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/tv-display', [TvDisplayController::class, 'index'])->name('tv-display');
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('requests', OfficeRequestController::class)->only(['index', 'store', 'update']);
    Route::resource('announcements', AnnouncementController::class);

    // Compliance Section
    Route::prefix('compliance')->name('compliance.')->group(function () {
        Route::resource('requirements', App\Http\Controllers\Compliance\RequirementController::class);
        Route::resource('submissions', App\Http\Controllers\Compliance\SubmissionController::class);
        Route::get('pending-outputs', [PendingOutputController::class, 'index'])->name('pending-outputs.index');
        Route::get('tracker', [ComplianceTrackerController::class, 'index'])->name('tracker.index');
    });

    // Schedule Section
    Route::prefix('schedule')->name('schedule.')->group(function () {
        Route::resource('meetings', MeetingController::class);
        Route::resource('activities', ActivityController::class);
        Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');
    });

    // Performance Section
    Route::prefix('performance')->name('performance.')->group(function () {
        Route::get('faculty', [FacultyPerformanceController::class, 'index'])->name('faculty');
        Route::get('program', [ProgramPerformanceController::class, 'index'])->name('program');
        Route::resource('rules', RecognitionRuleController::class);
    });

    // TV Configuration Section
    Route::prefix('tv-config')->name('tv-config.')->group(function () {
        Route::get('playlist', [PlaylistController::class, 'index'])->name('playlist.index');
        Route::post('playlist', [PlaylistController::class, 'store'])->name('playlist.store');
        Route::put('playlist/{playlist}', [PlaylistController::class, 'update'])->name('playlist.update');
        Route::delete('playlist/{playlist}', [PlaylistController::class, 'destroy'])->name('playlist.destroy');

        Route::get('slides', [SlideController::class, 'index'])->name('slides.index');
        Route::put('slides/{slide}', [SlideController::class, 'update'])->name('slides.update');

        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [SettingController::class, 'store'])->name('settings.store');
    });

    // Classroom Monitoring
    Route::get('/classroom-monitoring', [ClassroomMonitoringController::class, 'index'])->name('classroom-monitoring.index');
    Route::post('/classroom-monitoring/sync', [ClassroomMonitoringController::class, 'sync'])->name('classroom-monitoring.sync');

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
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
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
