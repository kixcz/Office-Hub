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
use App\Http\Controllers\Faculty\FacultyPortalController;
use App\Http\Controllers\FacultyAttendanceController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\LabInChargeMonitoringController;
use App\Http\Controllers\OfficeRequestController;
use App\Http\Controllers\Operations\ExamMonitoringController;
use App\Http\Controllers\Operations\FacultyWorkloadManagementController;
use App\Http\Controllers\Operations\LabInChargeManagementController;
use App\Http\Controllers\Operations\MakeUpClassMonitoringController;
use App\Http\Controllers\Operations\RoomUtilizationReportController;
use App\Http\Controllers\Performance\FacultyPerformanceController;
use App\Http\Controllers\Performance\ProgramPerformanceController;
use App\Http\Controllers\Performance\RecognitionRuleController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\RoomComplaintReportController;
use App\Http\Controllers\RoomInventoryController;
use App\Http\Controllers\Schedule\AcademicCalendarImportController;
use App\Http\Controllers\Schedule\ActivityController;
use App\Http\Controllers\Schedule\CalendarController;
use App\Http\Controllers\Schedule\MeetingController;
use App\Http\Controllers\Schedule\SemesterScheduleController;
use App\Http\Controllers\ScheduleReconciliationController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\Tv\CustomSlideController;
use App\Http\Controllers\Tv\PlaylistController;
use App\Http\Controllers\Tv\SettingController;
use App\Http\Controllers\Tv\SlideController;
use App\Http\Controllers\Tv\SpotlightController;
use App\Http\Controllers\Tv\TvStudioController;
use App\Http\Controllers\TvDisplayController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

// TV Access by Code (Guest or Auth allowed)
Route::post('/tv-display/verify-code', [SettingController::class, 'verifyCode'])->name('tv-display.verify-code');
Route::get('/tv-display/{displayId?}', [TvDisplayController::class, 'index'])->name('tv-display');
Route::get('/tv/display/{displayId?}', [TvDisplayController::class, 'index'])->name('tv.display');

// One-click maintenance route for Hostinger shared hosting without SSH access
Route::get('/hostinger-fix-storage', function () {
    $results = [];

    // 1. Ensure public/storage directory exists
    $pubStorage = public_path('storage');
    if (is_link($pubStorage)) {
        @unlink($pubStorage);
        $results[] = 'Removed broken symlink at public/storage.';
    }

    if (! is_dir($pubStorage)) {
        @mkdir($pubStorage, 0755, true);
        $results[] = 'Created real directory public/storage.';
    }

    // 2. Copy files from storage/app/public to public/storage if missing
    $appPublic = storage_path('app/public');
    if (is_dir($appPublic)) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($appPublic, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        $copiedCount = 0;
        foreach ($files as $item) {
            $subPath = substr($item->getPathname(), strlen($appPublic) + 1);
            $target = $pubStorage.DIRECTORY_SEPARATOR.$subPath;

            if ($item->isDir()) {
                if (! is_dir($target)) {
                    @mkdir($target, 0755, true);
                }
            } else {
                $targetDir = dirname($target);
                if (! is_dir($targetDir)) {
                    @mkdir($targetDir, 0755, true);
                }
                if (! file_exists($target)) {
                    @copy($item->getPathname(), $target);
                    $copiedCount++;
                }
            }
        }
        $results[] = "Copied {$copiedCount} files to public/storage.";
    }

    // 3. Clear cache
    try {
        Artisan::call('optimize:clear');
        $results[] = 'Cleared application and route cache successfully.';
    } catch (Throwable $e) {
        $results[] = 'Cache clear note: '.$e->getMessage();
    }

    return response()->json([
        'status' => 'success',
        'message' => 'Hostinger storage directory structure fixed successfully!',
        'details' => $results,
    ]);
});

// Fallback direct storage file server if web server/Apache denies direct access (403)
Route::get('/storage/{path}', function ($path) {
    $fullPath = public_path('storage/'.$path);
    if (! file_exists($fullPath)) {
        $fullPath = storage_path('app/public/'.$path);
    }

    if (! file_exists($fullPath) || is_dir($fullPath)) {
        abort(404);
    }

    return response()->file($fullPath, [
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

Route::middleware(['auth'])->group(function () {
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
            Route::get('rooms', [RoomInventoryController::class, 'index'])->name('rooms');
            Route::post('rooms', [RoomInventoryController::class, 'store'])->name('rooms.store');
            Route::put('rooms/{room}', [RoomInventoryController::class, 'update'])->name('rooms.update');
            Route::delete('rooms/{room}', [RoomInventoryController::class, 'destroy'])->name('rooms.destroy');
            Route::post('rooms/report-problem', [RoomInventoryController::class, 'reportProblem'])->name('rooms.report-problem');
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
        Route::get('candidates', [SemesterScheduleController::class, 'getCandidates'])->name('candidates');
        Route::post('candidates/select-draft', [SemesterScheduleController::class, 'selectWorkingDraft'])->name('candidates.select-draft');
        Route::get('adjustments', [SemesterScheduleController::class, 'adjustmentsHub'])->name('adjustments');
        Route::post('adjustments/window', [SemesterScheduleController::class, 'toggleAdjustmentWindow'])->name('adjustments.window');
        Route::post('adjustments/swap-request', [SemesterScheduleController::class, 'submitSwapRequest'])->name('adjustments.swap-request');
        Route::post('adjustments/swap-consent/{swapRequest}', [SemesterScheduleController::class, 'respondSwapConsent'])->name('adjustments.swap-consent');
        Route::post('adjustments/consolidate-batch', [SemesterScheduleController::class, 'consolidateBatch'])->name('adjustments.consolidate-batch');
        Route::post('adjustments/publish-revision', [SemesterScheduleController::class, 'publishRevision'])->name('adjustments.publish-revision');
        Route::get('gemini', [SemesterScheduleController::class, 'geminiAssistant'])->name('gemini');
        Route::post('gemini/ask', [SemesterScheduleController::class, 'askGeminiAssistant'])->name('gemini.ask');

        // Schedule Sync & Reconciliation
        Route::prefix('reconciliation')->name('reconciliation.')->group(function () {
            Route::get('/', [ScheduleReconciliationController::class, 'index'])->name('index');
            Route::post('/sync', [ScheduleReconciliationController::class, 'sync'])->name('sync');
            Route::post('/records/{record}', [ScheduleReconciliationController::class, 'updateRecord'])->name('update-record');
            Route::post('/batches/{batch}/bulk-approve', [ScheduleReconciliationController::class, 'bulkApprove'])->name('bulk-approve');
            Route::post('/batches/{batch}/commit', [ScheduleReconciliationController::class, 'commit'])->name('commit');
        });
    });

    // Lab In-Charge Operational Monitoring & End-of-Day Reconciliation
    Route::prefix('monitoring/lab-in-charge')->name('lab-in-charge.')->group(function () {
        Route::get('/', [LabInChargeMonitoringController::class, 'index'])->name('index');
        Route::post('/observation', [LabInChargeMonitoringController::class, 'recordObservation'])->name('observation');
        Route::post('/request-correction', [LabInChargeMonitoringController::class, 'requestCorrection'])->name('request-correction');
        Route::post('/disruption', [LabInChargeMonitoringController::class, 'reportDisruption'])->name('disruption');
        Route::post('/discrepancies/{discrepancy}/status', [LabInChargeMonitoringController::class, 'updateDiscrepancyStatus'])->name('discrepancy.status');
        Route::post('/discrepancies/{discrepancy}/resolve', [LabInChargeMonitoringController::class, 'resolveDiscrepancy'])->name('discrepancy.resolve');

        // Reassign / Map Faculty on Schedule
        Route::post('/schedules/{schedule}/reassign-faculty', [LabInChargeMonitoringController::class, 'reassignScheduleFaculty'])->name('schedules.reassign-faculty');

        // End-of-Day Reconciliation & Closing
        Route::get('/end-of-day', [LabInChargeMonitoringController::class, 'endOfDayReport'])->name('end-of-day');
        Route::post('/end-of-day/submit', [LabInChargeMonitoringController::class, 'submitEndOfDayReport'])->name('end-of-day.submit');
        Route::post('/end-of-day/{report}/review', [LabInChargeMonitoringController::class, 'reviewEndOfDayReport'])->name('end-of-day.review');
        Route::post('/end-of-day/{report}/finalize', [LabInChargeMonitoringController::class, 'finalizeEndOfDayReport'])->name('end-of-day.finalize');
        Route::post('/end-of-day/{report}/reopen', [LabInChargeMonitoringController::class, 'reopenEndOfDayReport'])->name('end-of-day.reopen');
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
        Route::get('/', [TvStudioController::class, 'dashboard'])->name('index');
        Route::get('dashboard', [TvStudioController::class, 'dashboard'])->name('dashboard');

        Route::get('playlist', [PlaylistController::class, 'index'])->name('playlist.index');
        Route::post('playlist', [PlaylistController::class, 'store'])->name('playlist.store');
        Route::post('playlist/reorder', [PlaylistController::class, 'reorder'])->name('playlist.reorder');
        Route::put('playlist/{playlist}', [PlaylistController::class, 'update'])->name('playlist.update');
        Route::delete('playlist/{playlist}', [PlaylistController::class, 'destroy'])->name('playlist.destroy');

        Route::get('slides', [SlideController::class, 'index'])->name('slides.index');
        Route::post('slides', [SlideController::class, 'store'])->name('slides.store');
        Route::get('slides/builder', [SlideController::class, 'builder'])->name('slides.builder');
        Route::get('slides/{slide}/edit', [SlideController::class, 'edit'])->name('slides.edit');
        Route::put('slides/{slide}', [SlideController::class, 'update'])->name('slides.update');

        // Spotlight Slides / Recognition & Celebrations
        Route::get('spotlight', [SpotlightController::class, 'index'])->name('spotlight.index');
        Route::get('spotlight/create', [SpotlightController::class, 'create'])->name('spotlight.create');
        Route::post('spotlight', [SpotlightController::class, 'store'])->name('spotlight.store');
        Route::get('spotlight/{spotlight}/edit', [SpotlightController::class, 'edit'])->name('spotlight.edit');
        Route::put('spotlight/{spotlight}', [SpotlightController::class, 'update'])->name('spotlight.update');
        Route::delete('spotlight/{spotlight}', [SpotlightController::class, 'destroy'])->name('spotlight.destroy');
        Route::post('spotlight/{spotlight}/toggle-publish', [SpotlightController::class, 'togglePublish'])->name('spotlight.toggle-publish');

        // Custom Content Slides / Manual Slides
        Route::get('custom', [CustomSlideController::class, 'index'])->name('custom.index');
        Route::get('custom/create', [CustomSlideController::class, 'create'])->name('custom.create');
        Route::post('custom', [CustomSlideController::class, 'store'])->name('custom.store');
        Route::get('custom/{custom}/edit', [CustomSlideController::class, 'edit'])->name('custom.edit');
        Route::post('custom/{custom}', [CustomSlideController::class, 'update'])->name('custom.update');
        Route::delete('custom/{custom}', [CustomSlideController::class, 'destroy'])->name('custom.destroy');
        Route::post('custom/{custom}/toggle-publish', [CustomSlideController::class, 'togglePublish'])->name('custom.toggle-publish');
        Route::post('custom/{custom}/duplicate', [CustomSlideController::class, 'duplicate'])->name('custom.duplicate');

        Route::get('templates', [TvStudioController::class, 'templates'])->name('templates.index');
        Route::get('widgets', [TvStudioController::class, 'widgets'])->name('widgets.index');

        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [SettingController::class, 'store'])->name('settings.store');
        Route::post('settings/reset', [SettingController::class, 'reset'])->name('settings.reset');
        Route::post('settings/generate-code', [SettingController::class, 'generateCode'])->name('settings.generate-code');

        Route::get('preview', [TvStudioController::class, 'preview'])->name('preview.index');
        Route::get('history', [TvStudioController::class, 'history'])->name('history.index');
        Route::post('history/{id}/rollback', [TvStudioController::class, 'rollback'])->name('history.rollback');
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
        Route::post('/update-faculty-name', [FacultyAttendanceController::class, 'updateFacultyName'])->name('update-faculty-name');
    });

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    // Accomplishments
    Route::get('/accomplishments', [AccomplishmentController::class, 'index'])->name('accomplishments.index');
    Route::post('/accomplishments', [AccomplishmentController::class, 'store'])->name('accomplishments.store');
    Route::post('/accomplishments/{accomplishment}/verify', [AccomplishmentController::class, 'verify'])->name('accomplishments.verify');
    Route::post('/accomplishments/{accomplishment}/return', [AccomplishmentController::class, 'returnAccomplishment'])->name('accomplishments.return');
    // Document Routing
    Route::get('/documents', [DocumentRouteController::class, 'index'])->name('documents.index');
    Route::post('/documents', [DocumentRouteController::class, 'store'])->name('documents.store');
    Route::patch('/documents/{document}', [DocumentRouteController::class, 'update'])->name('documents.update');

    // Programs & Faculties
    Route::resource('programs', ProgramController::class);
    Route::post('/faculties/{faculty}/assign-role', [FacultyController::class, 'assignRole'])->name('faculties.assign-role');
    Route::resource('faculties', FacultyController::class);

    // Operations -> Facility & Room Problem Reports (Dean / Super Admin)
    Route::prefix('operations/facility-reports')->name('operations.facility-reports.')->group(function () {
        Route::get('/', [RoomComplaintReportController::class, 'index'])->name('index');
        Route::patch('/{report}', [RoomComplaintReportController::class, 'update'])->name('update');
        Route::delete('/{report}', [RoomComplaintReportController::class, 'destroy'])->name('destroy');
    });

    // Operations -> Exam Monitoring (Faculty, Program Heads, Dean, Super Admin)
    Route::prefix('operations/exam-monitoring')->name('operations.exam-monitoring.')->group(function () {
        Route::get('/', [ExamMonitoringController::class, 'index'])->name('index');
        Route::post('/', [ExamMonitoringController::class, 'store'])->name('store');
        Route::patch('/{examSchedule}/conducted', [ExamMonitoringController::class, 'markConducted'])->name('conducted');
        Route::patch('/{examSchedule}/not-conducted', [ExamMonitoringController::class, 'markNotConducted'])->name('not-conducted');
        Route::patch('/{examSchedule}/reschedule', [ExamMonitoringController::class, 'reschedule'])->name('reschedule');
        Route::get('/tv-widget-data', [ExamMonitoringController::class, 'tvWidgetData'])->name('tv-widget-data');
    });

    // Operations -> Faculty Workload Management (Super Admin & Dean)
    Route::prefix('operations/faculty-workload')->name('operations.faculty-workload.')->group(function () {
        Route::get('/', [FacultyWorkloadManagementController::class, 'index'])->name('index');
        Route::post('/{faculty}/lock', [FacultyWorkloadManagementController::class, 'lockWorkload'])->name('lock');
        Route::post('/{faculty}/unlock', [FacultyWorkloadManagementController::class, 'unlockWorkload'])->name('unlock');
    });

    // Operations -> Make-Up Class Monitoring (Super Admin, Dean & Program Heads)
    Route::prefix('operations/make-up-classes')->name('operations.make-up-classes.')->group(function () {
        Route::get('/', [MakeUpClassMonitoringController::class, 'index'])->name('index');
        Route::patch('/{makeUpClassRequest}/review', [MakeUpClassMonitoringController::class, 'review'])->name('review');
    });

    // Operations -> Room Utilization Report & Capacity Analytics (Super Admin, Dean & Program Heads)
    Route::prefix('operations/room-utilization')->name('operations.room-utilization.')->group(function () {
        Route::get('/', [RoomUtilizationReportController::class, 'index'])->name('index');
    });

    // Operations -> Lab In-Charge Management & Facility Responsibility (Super Admin)
    Route::prefix('operations/lab-in-charge')->name('operations.lab-in-charge.')->group(function () {
        Route::get('/', [LabInChargeManagementController::class, 'index'])->name('index');
        Route::post('/users', [LabInChargeManagementController::class, 'createUser'])->name('users.create');
        Route::post('/assignments', [LabInChargeManagementController::class, 'storeAssignment'])->name('assignments.store');
        Route::post('/assignments/{assignment}/temporary-coverage', [LabInChargeManagementController::class, 'addTemporaryCoverage'])->name('assignments.temporary-coverage');
        Route::post('/assignments/{assignment}/reassign', [LabInChargeManagementController::class, 'reassign'])->name('assignments.reassign');
        Route::post('/assignments/{assignment}/suspend', [LabInChargeManagementController::class, 'suspend'])->name('assignments.suspend');
        Route::post('/assignments/{assignment}/end', [LabInChargeManagementController::class, 'endAssignment'])->name('assignments.end');
        Route::post('/sessions/{session}/reopen', [LabInChargeManagementController::class, 'reopenMonitoringSession'])->name('sessions.reopen');
    });

    // Faculty Personal Academic & Administrative Workspace (7 Groups, 19 Modules)
    Route::prefix('faculty')->name('faculty.')->group(function () {
        Route::get('/dashboard', [FacultyPortalController::class, 'dashboard'])->name('dashboard');
        Route::get('/calendar', [FacultyPortalController::class, 'calendar'])->name('calendar');
        Route::post('/calendar/personal', [FacultyPortalController::class, 'storePersonalEvent'])->name('calendar.personal.store');
        Route::delete('/calendar/personal/{id}', [FacultyPortalController::class, 'destroyPersonalEvent'])->name('calendar.personal.destroy');
        Route::get('/schedule', [FacultyPortalController::class, 'schedule'])->name('schedule');
        Route::get('/loading', [FacultyPortalController::class, 'loading'])->name('loading');
        Route::get('/workload', [FacultyPortalController::class, 'workload'])->name('workload');
        Route::get('/make-up-classes', [FacultyPortalController::class, 'makeUpClasses'])->name('make-up-classes');
        Route::post('/make-up-classes', [FacultyPortalController::class, 'storeMakeUpClass'])->name('make-up-classes.store');
        Route::patch('/make-up-classes/{makeUpClassRequest}/confirm', [FacultyPortalController::class, 'confirmMakeUpConducted'])->name('make-up-classes.confirm');
        Route::get('/exam-schedules', [FacultyPortalController::class, 'examSchedules'])->name('exam-schedules');
        Route::post('/exam-schedules', [FacultyPortalController::class, 'storeExamSchedule'])->name('exam-schedules.store');
        Route::delete('/exam-schedules/{examSchedule}', [FacultyPortalController::class, 'destroyExamSchedule'])->name('exam-schedules.destroy');
        Route::get('/attendance', [FacultyPortalController::class, 'attendance'])->name('attendance');
        Route::get('/availability', [FacultyPortalController::class, 'availability'])->name('availability');
        Route::post('/availability', [FacultyPortalController::class, 'updateAvailability'])->name('availability.update');

        Route::get('/requirements', [FacultyPortalController::class, 'requirements'])->name('requirements');
        Route::post('/requirements/{requirement}/submit', [FacultyPortalController::class, 'submitRequirement'])->name('requirements.submit');
        Route::get('/submissions', [FacultyPortalController::class, 'submissions'])->name('submissions');

        Route::get('/tasks', [FacultyPortalController::class, 'tasks'])->name('tasks');
        Route::post('/tasks', [FacultyPortalController::class, 'storeTask'])->name('tasks.store');
        Route::patch('/tasks/{task}', [FacultyPortalController::class, 'updateTask'])->name('tasks.update');
        Route::patch('/tasks/{task}/status', [FacultyPortalController::class, 'updateTaskStatus'])->name('tasks.status');
        Route::delete('/tasks/{task}', [FacultyPortalController::class, 'deleteTask'])->name('tasks.destroy');

        Route::get('/research-extension', [FacultyPortalController::class, 'researchExtension'])->name('research-extension');
        Route::post('/research-extension/research', [FacultyPortalController::class, 'storeResearch'])->name('research-extension.research.store');
        Route::delete('/research-extension/research/{research}', [FacultyPortalController::class, 'deleteResearch'])->name('research-extension.research.destroy');
        Route::post('/research-extension/extension', [FacultyPortalController::class, 'storeExtension'])->name('research-extension.extension.store');
        Route::delete('/research-extension/extension/{extension}', [FacultyPortalController::class, 'deleteExtension'])->name('research-extension.extension.destroy');
        Route::get('/meetings', [FacultyPortalController::class, 'meetings'])->name('meetings');
        Route::get('/accomplishments', [FacultyPortalController::class, 'accomplishments'])->name('accomplishments');
        Route::post('/accomplishments/extract-metadata', [FacultyPortalController::class, 'extractAccomplishmentMetadata'])->name('accomplishments.extract');
        Route::post('/accomplishments', [FacultyPortalController::class, 'storeAccomplishment'])->name('accomplishments.store');
        Route::delete('/accomplishments/{accomplishment}', [FacultyPortalController::class, 'deleteAccomplishment'])->name('accomplishments.destroy');

        Route::get('/documents', [FacultyPortalController::class, 'documents'])->name('documents');
        Route::get('/profile', [FacultyPortalController::class, 'profile'])->name('profile');
        Route::post('/profile', [FacultyPortalController::class, 'updateProfile'])->name('profile.update');

        Route::get('/corrections', [FacultyPortalController::class, 'corrections'])->name('corrections');
        Route::post('/corrections', [FacultyPortalController::class, 'storeCorrection'])->name('corrections.store');

        Route::get('/notifications', [FacultyPortalController::class, 'notifications'])->name('notifications');

        // Legacy / shortcut workspace redirect
        Route::get('/workspace', [FacultyPortalController::class, 'dashboard'])->name('workspace');
    });

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
