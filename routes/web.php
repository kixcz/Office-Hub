<?php

use App\Http\Controllers\AccomplishmentController;
use App\Http\Controllers\Administration\AcademicPeriodController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Auth\PortalContextController;
use App\Http\Controllers\ClassroomMonitoringController;
use App\Http\Controllers\College\CollegeBrandSettingController;
use App\Http\Controllers\Compliance\ComplianceTrackerController;
use App\Http\Controllers\Compliance\PendingOutputController;
use App\Http\Controllers\Compliance\RequirementController;
use App\Http\Controllers\Compliance\SubmissionController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOfferingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentRouteController;
use App\Http\Controllers\Faculty\FacultyPortalController;
use App\Http\Controllers\FacultyAttendanceController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Institution\InstitutionGovernanceController;
use App\Http\Controllers\LabInChargeMonitoringController;
use App\Http\Controllers\LabInventoryManagementController;
use App\Http\Controllers\OfficeRequestController;
use App\Http\Controllers\Operations\ExamMonitoringController;
use App\Http\Controllers\Operations\FacultyWorkloadManagementController;
use App\Http\Controllers\Operations\LabInChargeManagementController;
use App\Http\Controllers\Operations\LocatorSlipController;
use App\Http\Controllers\Operations\MakeUpClassMonitoringController;
use App\Http\Controllers\Operations\RoomUtilizationReportController;
use App\Http\Controllers\Operations\TravelOrderController;
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
use App\Http\Controllers\SectionManagementController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\Tv\CustomSlideController;
use App\Http\Controllers\Tv\PlaylistController;
use App\Http\Controllers\Tv\SettingController;
use App\Http\Controllers\Tv\SlideController;
use App\Http\Controllers\Tv\SpotlightController;
use App\Http\Controllers\Tv\TvCleaningScheduleController;
use App\Http\Controllers\Tv\TvStudioController;
use App\Http\Controllers\TvDisplayController;
use App\Http\Controllers\Vpaa\VpaaAcademicController;
use App\Http\Controllers\Vpaf\VpafExecutiveController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

// TV Access by Code (Guest or Auth allowed)
Route::post('/tv-display/verify-code', [SettingController::class, 'verifyCode'])->name('tv-display.verify-code');
Route::get('/tv-display/{displayId?}', [TvDisplayController::class, 'index'])->name('tv-display');
Route::get('/tv/display/{displayId?}', [TvDisplayController::class, 'index'])->name('tv.display');
Route::get('/api/tv/data/{displayId?}', [TvDisplayController::class, 'getTvDataApi'])->name('tv.data.api');
Route::get('/tv-display/{displayId?}/data', [TvDisplayController::class, 'getTvDataApi'])->name('tv-display.data');

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
    // Multi-Role & Workspace Context Switcher
    Route::post('context/switch', [PortalContextController::class, 'switch'])->name('context.switch');
    Route::post('context/default', [PortalContextController::class, 'setDefault'])->name('context.default');
    Route::get('context/choose-workspace', [PortalContextController::class, 'chooseWorkspace'])->name('context.choose-workspace');

    // Multi-Role & Workspace Context Switcher
    Route::post('context/switch', [PortalContextController::class, 'switch'])->name('context.switch');
    Route::post('context/default', [PortalContextController::class, 'setDefault'])->name('context.default');
    Route::get('context/choose-workspace', [PortalContextController::class, 'chooseWorkspace'])->name('context.choose-workspace');

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('requests', OfficeRequestController::class)->only(['index', 'store', 'update']);
    Route::resource('announcements', AnnouncementController::class);

    // Compliance Section
    Route::prefix('compliance')->name('compliance.')->group(function () {
        Route::post('requirements/{requirement}/extend-deadline', [RequirementController::class, 'extendDeadline'])->name('requirements.extend-deadline');
        Route::post('requirements/{requirement}/remind', [RequirementController::class, 'sendReminder'])->name('requirements.remind');
        Route::post('requirements/{requirement}/close', [RequirementController::class, 'closeRequirement'])->name('requirements.close');
        Route::post('requirements/{requirement}/bulk-action', [RequirementController::class, 'bulkAction'])->name('requirements.bulk-action');
        Route::post('requirements/{requirement}/submissions/{submission}/verify', [RequirementController::class, 'verifySubmission'])->name('requirements.submissions.verify');
        Route::post('requirements/{requirement}/submissions/{submission}/return', [RequirementController::class, 'returnSubmission'])->name('requirements.submissions.return');
        Route::post('requirements/{requirement}/submissions/{submission}/remark', [RequirementController::class, 'addRemark'])->name('requirements.submissions.remark');
        Route::post('requirements/{requirement}/submissions/{submission}/extend', [RequirementController::class, 'extendSubmissionDeadline'])->name('requirements.submissions.extend');
        Route::post('requirements/{requirement}/submissions/{submission}/remind', [RequirementController::class, 'sendSubmissionReminder'])->name('requirements.submissions.remind');
        Route::post('requirements/{requirement}/submissions/{submission}/mark-not-required', [RequirementController::class, 'markSubmissionNotRequired'])->name('requirements.submissions.mark-not-required');
        Route::resource('requirements', RequirementController::class);
        Route::post('submissions/bulk-record', [SubmissionController::class, 'bulkRecord'])->name('submissions.bulk-record');
        Route::resource('submissions', SubmissionController::class);
        Route::get('pending-outputs', [PendingOutputController::class, 'index'])->name('pending-outputs.index');
        Route::get('tracker', [ComplianceTrackerController::class, 'index'])->name('tracker.index');
    });

    // Schedule Section
    Route::prefix('schedule')->name('schedule.')->group(function () {
        Route::post('meetings/bulk-delete', [MeetingController::class, 'bulkDestroy'])->name('meetings.bulk-delete');
        Route::resource('meetings', MeetingController::class);
        Route::post('activities/bulk-delete', [ActivityController::class, 'bulkDestroy'])->name('activities.bulk-delete');
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
            Route::get('courses', [SemesterScheduleController::class, 'masterDataCourses'])->name('courses');
            Route::get('sections', [SemesterScheduleController::class, 'masterDataSections'])->name('sections');
            Route::get('faculty', [SemesterScheduleController::class, 'masterDataFaculty'])->name('faculty');
            Route::get('faculty-specializations', [SemesterScheduleController::class, 'masterDataFacultySpecializations'])->name('faculty-specializations');
            Route::get('faculty-preferences', [SemesterScheduleController::class, 'masterDataFacultyPreferences'])->name('faculty-preferences');
            Route::get('faculty-availability', [SemesterScheduleController::class, 'masterDataFacultyAvailability'])->name('faculty-availability');
            Route::post('faculty/load-targets', [SemesterScheduleController::class, 'updateFacultyLoadTargets'])->name('faculty.load-targets');
            Route::post('faculty-specializations/verify', [SemesterScheduleController::class, 'verifyFacultySpecialization'])->name('faculty-specializations.verify');
            Route::post('faculty-preferences/update', [SemesterScheduleController::class, 'updateFacultyPreferences'])->name('faculty-preferences.update');
            Route::get('rooms', [SemesterScheduleController::class, 'masterDataRooms'])->name('rooms');
            Route::post('rooms', [SemesterScheduleController::class, 'storeMasterDataRoom'])->name('rooms.store');
            Route::put('rooms/{room}', [SemesterScheduleController::class, 'updateMasterDataRoom'])->name('rooms.update');
            Route::delete('rooms/{room}', [SemesterScheduleController::class, 'destroyMasterDataRoom'])->name('rooms.destroy');
        });

        // Semester Schedule Generator System
        Route::get('generator', [SemesterScheduleController::class, 'generator'])->name('generator');
        Route::post('generator/import', [SemesterScheduleController::class, 'importAcademicData'])->name('generator.import');
        Route::post('generator/assign-faculty', [SemesterScheduleController::class, 'assignFaculty'])->name('generator.assign-faculty');
        Route::get('sections', [SemesterScheduleController::class, 'sectionsOfferings'])->name('sections');
        Route::get('loading', [SemesterScheduleController::class, 'facultyLoading'])->name('loading');
        Route::get('credits', [SemesterScheduleController::class, 'facultyCredits'])->name('credits');
        Route::post('credits', [SemesterScheduleController::class, 'storeFacultyCredit'])->name('credits.store');
        Route::put('credits/{credit}', [SemesterScheduleController::class, 'updateFacultyCredit'])->name('credits.update');
        Route::delete('credits/{credit}', [SemesterScheduleController::class, 'destroyFacultyCredit'])->name('credits.destroy');
        Route::match(['get', 'post'], 'loading-generator', [SemesterScheduleController::class, 'loadingGenerator'])->name('loading-generator');
        Route::post('loading-generator/run', [SemesterScheduleController::class, 'runLoadingSolver'])->name('loading-generator.run');
        Route::post('loading-generator/apply', [SemesterScheduleController::class, 'applyLoadingCandidate'])->name('loading-generator.apply');
        Route::post('loading-generator/manual-assign', [SemesterScheduleController::class, 'manualAssignLoading'])->name('loading-generator.manual-assign');
        Route::post('loading-generator/rules', [SemesterScheduleController::class, 'storeCourseAssignmentRule'])->name('loading-generator.rules.store');
        Route::delete('loading-generator/rules/{rule}', [SemesterScheduleController::class, 'destroyCourseAssignmentRule'])->name('loading-generator.rules.destroy');
        Route::get('loading-review', [SemesterScheduleController::class, 'loadingReview'])->name('loading-review');
        Route::post('loading-review/endorse-program', [SemesterScheduleController::class, 'endorseProgramLoadingReview'])->name('loading-review.endorse-program');
        Route::post('loading-review/request-revision', [SemesterScheduleController::class, 'requestProgramLoadingRevision'])->name('loading-review.request-revision');
        Route::post('loading-review/flag', [SemesterScheduleController::class, 'storeLoadingFlag'])->name('loading-review.flag');
        Route::post('loading-review/resolve-flag', [SemesterScheduleController::class, 'resolveLoadingFlag'])->name('loading-review.resolve-flag');
        Route::post('loading-review/dean-decision', [SemesterScheduleController::class, 'deanLoadingDecision'])->name('loading-review.dean-decision');
        Route::get('policies', [SemesterScheduleController::class, 'loadPolicies'])->name('policies');
        Route::post('policies/update', [SemesterScheduleController::class, 'updateLoadPolicies'])->name('policies.update');
        // Timetable Generation with Loading Gating & Locked Version Source
        Route::prefix('timetable')->name('timetable.')->group(function () {
            Route::get('constraints', [SemesterScheduleController::class, 'timetableConstraints'])->name('constraints');
            Route::get('generator', [SemesterScheduleController::class, 'timetableScheduleGenerator'])->name('generator');
            Route::post('generator/run', [SemesterScheduleController::class, 'runTimetableGenerator'])->name('generator.run');
            Route::get('candidates', [SemesterScheduleController::class, 'timetableCandidates'])->name('candidates');
            Route::post('candidates/set-working-draft', [SemesterScheduleController::class, 'setTimetableWorkingDraft'])->name('candidates.set-working-draft');
            Route::get('conflict-checker', [SemesterScheduleController::class, 'timetableConflictChecker'])->name('conflict-checker');
            Route::get('editor', [SemesterScheduleController::class, 'timetableEditor'])->name('editor');
            Route::post('editor/validate-move', [SemesterScheduleController::class, 'validateTimetableMove'])->name('editor.validate-move');
            Route::post('editor/save-changes', [SemesterScheduleController::class, 'saveTimetableChanges'])->name('editor.save-changes');

            // Faculty Loading Publication & Change Requests Workflow
            Route::post('publish-loading', [SemesterScheduleController::class, 'publishFacultyLoading'])->name('publish-loading');
            Route::post('lock-loading', [SemesterScheduleController::class, 'lockFacultyLoading'])->name('lock-loading');
            Route::post('reopen-loading', [SemesterScheduleController::class, 'reopenFacultyLoading'])->name('reopen-loading');
            Route::post('course-change-request', [SemesterScheduleController::class, 'submitCourseChangeRequest'])->name('course-change-request');
            Route::post('course-change-respond', [SemesterScheduleController::class, 'respondCourseChangeRequest'])->name('course-change-respond');
            Route::post('course-change-decide', [SemesterScheduleController::class, 'decideCourseChangeRequest'])->name('course-change-decide');
        });
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
    Route::get('/monitoring/lab-attendance', function (Request $request) {
        return redirect()->route('lab-in-charge.index', array_merge($request->query(), ['tab' => 'attendance']));
    })->name('lab-attendance.index');

    Route::prefix('monitoring/lab-in-charge')->name('lab-in-charge.')->group(function () {
        Route::get('/', [LabInChargeMonitoringController::class, 'index'])->name('index');
        Route::post('/observation', [LabInChargeMonitoringController::class, 'recordObservation'])->name('observation');
        Route::post('/sessions/{session}/verify', [LabInChargeMonitoringController::class, 'verifyObservation'])->name('sessions.verify');
        Route::post('/sessions/{session}/finalize', [LabInChargeMonitoringController::class, 'finalizeSession'])->name('sessions.finalize');
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

        // Cleaners Duty Schedule Slide (Editable)
        Route::get('cleaners', [TvCleaningScheduleController::class, 'index'])->name('cleaners.index');
        Route::put('cleaners/{schedule}', [TvCleaningScheduleController::class, 'update'])->name('cleaners.update');
        Route::post('cleaners/{schedule}/reset', [TvCleaningScheduleController::class, 'reset'])->name('cleaners.reset');

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

    // College Brand & Theme Settings (Scope-Aware Branding for College Admins & Deans)
    Route::prefix('college/settings')->name('college.settings.')->group(function () {
        Route::get('branding', [CollegeBrandSettingController::class, 'index'])->name('branding');
        Route::post('branding', [CollegeBrandSettingController::class, 'update'])->name('branding.update');
        Route::post('branding/reset', [CollegeBrandSettingController::class, 'reset'])->name('branding.reset');
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

    // Academic Structure: Programs & Curriculum
    Route::resource('programs', ProgramController::class);
    Route::post('/programs/{program}/curricula', [ProgramController::class, 'storeCurriculum'])->name('programs.curricula.store');
    Route::post('/curricula/{curriculum}/copy', [ProgramController::class, 'copyCurriculum'])->name('curricula.copy');
    Route::patch('/curricula/{curriculum}/status', [ProgramController::class, 'toggleCurriculumStatus'])->name('curricula.status');
    Route::post('/curricula/{curriculum}/courses', [ProgramController::class, 'addCourseToCurriculum'])->name('curricula.courses.add');
    Route::put('/curricula/{curriculum}/courses/{curriculumCourse}', [ProgramController::class, 'updateCurriculumCourse'])->name('curricula.courses.update');
    Route::delete('/curricula/{curriculum}/courses/{course}', [ProgramController::class, 'removeCourseFromCurriculum'])->name('curricula.courses.remove');

    // Academic Structure: Canonical Courses Catalog
    Route::post('/courses/sync-sheets', [CourseController::class, 'syncSheets'])->name('courses.sync-sheets');
    Route::post('/courses/import', [CourseController::class, 'importCatalog'])->name('courses.import');
    Route::resource('courses', CourseController::class);

    // Academic Structure: Sections (Student Cohorts)
    Route::post('/sections/sync-sheets', [SectionManagementController::class, 'syncSheets'])->name('sections.sync-sheets');
    Route::post('/sections/import-csv', [SectionManagementController::class, 'importCsv'])->name('sections.import-csv');
    Route::post('/sections/bulk', [SectionManagementController::class, 'bulkCreate'])->name('sections.bulk');
    Route::post('/sections/copy-previous', [SectionManagementController::class, 'copyPreviousSections'])->name('sections.copy-previous');
    Route::post('/sections/{section}/generate-offerings', [SectionManagementController::class, 'generateOfferingsForSection'])->name('sections.generate-offerings');
    Route::resource('sections', SectionManagementController::class);

    // Academic Structure: Semester Course Offerings
    Route::post('/course-offerings/generate', [CourseOfferingController::class, 'generateFromCurriculum'])->name('course-offerings.generate');
    Route::post('/course-offerings/bulk-status', [CourseOfferingController::class, 'bulkUpdateStatus'])->name('course-offerings.bulk-status');
    Route::resource('course-offerings', CourseOfferingController::class);

    // Faculty Management
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

    // Operations -> Locator Slips Monitoring (Synchronized with e-HRIS)
    Route::prefix('operations/locator-slips')->name('operations.locator-slips.')->group(function () {
        Route::get('/', [LocatorSlipController::class, 'index'])->name('index');
        Route::post('/', [LocatorSlipController::class, 'store'])->name('store');
        Route::post('/sync', [LocatorSlipController::class, 'sync'])->name('sync');
        Route::patch('/{locatorSlip}/status', [LocatorSlipController::class, 'updateStatus'])->name('status');
    });

    // Operations -> Travel Orders Monitoring (Synchronized with e-HRIS)
    Route::prefix('operations/travel-orders')->name('operations.travel-orders.')->group(function () {
        Route::get('/', [TravelOrderController::class, 'index'])->name('index');
        Route::post('/', [TravelOrderController::class, 'store'])->name('store');
        Route::post('/sync', [TravelOrderController::class, 'sync'])->name('sync');
        Route::patch('/{travelOrder}/status', [TravelOrderController::class, 'updateStatus'])->name('status');
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
        Route::match(['post', 'patch'], '/{makeUpClassRequest}/review', [MakeUpClassMonitoringController::class, 'review'])->name('review');
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
        Route::post('/notifications/{id}/read', [FacultyPortalController::class, 'markNotificationAsRead'])->name('notifications.read');
        Route::post('/notifications/read-all', [FacultyPortalController::class, 'markAllNotificationsAsRead'])->name('notifications.read-all');

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

    // Laboratory & Facilities Management Ecosystem
    Route::prefix('facilities')->name('facilities.')->group(function () {
        // Rooms & Laboratories Module (Physical spaces & operational availability registry)
        Route::get('rooms', [RoomInventoryController::class, 'index'])->name('rooms.index');
        Route::post('rooms', [RoomInventoryController::class, 'store'])->name('rooms.store');
        Route::put('rooms/{room}', [RoomInventoryController::class, 'update'])->name('rooms.update');
        Route::delete('rooms/{room}', [RoomInventoryController::class, 'destroy'])->name('rooms.destroy');
        Route::get('rooms/find-available', [RoomInventoryController::class, 'findAvailable'])->name('rooms.find-available');
        Route::post('rooms/report-problem', [RoomInventoryController::class, 'reportProblem'])->name('rooms.report-problem');

        // Lab Inventory Management Module (Assets, equipment, consumables, inspections & maintenance)
        Route::get('lab-inventory', [LabInventoryManagementController::class, 'index'])->name('lab-inventory.index');
        Route::post('lab-inventory', [LabInventoryManagementController::class, 'store'])->name('lab-inventory.store');
        Route::put('lab-inventory/{item}', [LabInventoryManagementController::class, 'update'])->name('lab-inventory.update');
        Route::delete('lab-inventory/{item}', [LabInventoryManagementController::class, 'destroy'])->name('lab-inventory.destroy');
        Route::post('lab-inventory/adjustments', [LabInventoryManagementController::class, 'storeAdjustment'])->name('lab-inventory.adjustments.store');
        Route::post('lab-inventory/maintenance', [LabInventoryManagementController::class, 'storeMaintenanceTicket'])->name('lab-inventory.maintenance.store');
    });

    // Institution Super Admin Platform Governance Ecosystem (Velora Central Authority)
    Route::prefix('institution')->name('institution.')->group(function () {
        Route::get('/dashboard', [InstitutionGovernanceController::class, 'dashboard'])->name('dashboard');

        // 1. Organization Management (Institution -> Entities/Campuses -> Colleges -> Structure Tree)
        Route::get('/profile', [InstitutionGovernanceController::class, 'profile'])->name('profile');
        Route::match(['post', 'put'], '/profile', [InstitutionGovernanceController::class, 'updateProfile'])->name('profile.update');
        Route::get('/colleges', [InstitutionGovernanceController::class, 'colleges'])->name('colleges');
        Route::post('/colleges', [InstitutionGovernanceController::class, 'storeCollege'])->name('colleges.store');
        Route::put('/colleges/{college}', [InstitutionGovernanceController::class, 'updateCollege'])->name('colleges.update');
        Route::post('/colleges/{college}/reorganize', [InstitutionGovernanceController::class, 'reorganizeCollege'])->name('colleges.reorganize');
        Route::get('/colleges/setup/{college?}', [InstitutionGovernanceController::class, 'collegeSetup'])->name('colleges.setup');
        Route::match(['post', 'put'], '/colleges/{college}/setup', [InstitutionGovernanceController::class, 'updateCollegeSetup'])->name('colleges.setup.update');

        // Stage 3: Modules Configuration endpoints
        Route::post('/colleges/{college}/modules/update', [InstitutionGovernanceController::class, 'updateCollegeModules'])->name('colleges.modules.update');
        Route::post('/colleges/{college}/modules/apply-template', [InstitutionGovernanceController::class, 'applyModuleTemplate'])->name('colleges.modules.apply-template');

        // Stage 4: Leadership & Access endpoints
        Route::post('/colleges/{college}/leadership/assign', [InstitutionGovernanceController::class, 'assignCollegeLeadershipRole'])->name('colleges.leadership.assign');
        Route::delete('/colleges/{college}/leadership/{assignment}', [InstitutionGovernanceController::class, 'removeCollegeLeadershipRole'])->name('colleges.leadership.remove');
        Route::post('/colleges/{college}/leadership/invite', [InstitutionGovernanceController::class, 'inviteCollegeLeadershipUser'])->name('colleges.leadership.invite');

        // Stage 5: Programs Configuration endpoints
        Route::post('/colleges/{college}/programs', [InstitutionGovernanceController::class, 'storeCollegeProgram'])->name('colleges.programs.store');
        Route::put('/colleges/{college}/programs/{program}', [InstitutionGovernanceController::class, 'updateCollegeProgram'])->name('colleges.programs.update');
        Route::delete('/colleges/{college}/programs/{program}', [InstitutionGovernanceController::class, 'destroyCollegeProgram'])->name('colleges.programs.destroy');
        Route::post('/colleges/{college}/programs/bulk-import', [InstitutionGovernanceController::class, 'bulkImportCollegePrograms'])->name('colleges.programs.bulk-import');
        Route::post('/colleges/{college}/programs/copy-template', [InstitutionGovernanceController::class, 'copyProgramsFromTemplate'])->name('colleges.programs.copy-template');
        Route::post('/colleges/{college}/programs/settings', [InstitutionGovernanceController::class, 'updateProgramsSettings'])->name('colleges.programs.settings');

        // Stage 6: Facilities Configuration endpoints
        Route::post('/colleges/{college}/facilities', [InstitutionGovernanceController::class, 'storeCollegeFacility'])->name('colleges.facilities.store');
        Route::put('/colleges/{college}/facilities/{room}', [InstitutionGovernanceController::class, 'updateCollegeFacility'])->name('colleges.facilities.update');
        Route::delete('/colleges/{college}/facilities/{room}', [InstitutionGovernanceController::class, 'destroyCollegeFacility'])->name('colleges.facilities.destroy');
        Route::post('/colleges/{college}/facilities/bulk-import', [InstitutionGovernanceController::class, 'bulkImportCollegeFacilities'])->name('colleges.facilities.bulk-import');
        Route::post('/colleges/{college}/facilities/copy-template', [InstitutionGovernanceController::class, 'copyFacilitiesFromTemplate'])->name('colleges.facilities.copy-template');
        Route::post('/colleges/{college}/facilities/settings', [InstitutionGovernanceController::class, 'updateFacilitiesSettings'])->name('colleges.facilities.settings');

        // 2. Users, Canonical Identity, Role Management, Permission Matrix, Scoped Assignments & Access Requests
        Route::get('/users', [InstitutionGovernanceController::class, 'users'])->name('users');
        Route::post('/users', [InstitutionGovernanceController::class, 'storeUser'])->name('users.store');
        Route::put('/users/{user}', [InstitutionGovernanceController::class, 'updateUser'])->name('users.update');
        Route::post('/users/{user}/status', [InstitutionGovernanceController::class, 'updateUserStatus'])->name('users.status');

        Route::get('/roles', [InstitutionGovernanceController::class, 'roles'])->name('roles');
        Route::post('/roles', [InstitutionGovernanceController::class, 'storeRole'])->name('roles.store');
        Route::put('/roles/{role}', [InstitutionGovernanceController::class, 'updateRole'])->name('roles.update');
        Route::post('/roles/{role}/duplicate', [InstitutionGovernanceController::class, 'duplicateRole'])->name('roles.duplicate');
        Route::post('/roles/{role}/status', [InstitutionGovernanceController::class, 'updateRoleStatus'])->name('roles.status');
        Route::delete('/roles/{role}', [InstitutionGovernanceController::class, 'destroyRole'])->name('roles.destroy');
        Route::post('/roles/{role}/permissions/toggle', [InstitutionGovernanceController::class, 'toggleRolePermission'])->name('roles.permissions.toggle');
        Route::post('/roles/{role}/permissions/bulk', [InstitutionGovernanceController::class, 'syncRolePermissions'])->name('roles.permissions.bulk');

        Route::get('/scoped-roles', [InstitutionGovernanceController::class, 'scopedRoles'])->name('scoped-roles');
        Route::post('/scoped-roles', [InstitutionGovernanceController::class, 'storeScopedRole'])->name('scoped-roles.store');
        Route::patch('/scoped-roles/{assignment}/status', [InstitutionGovernanceController::class, 'updateScopedRoleStatus'])->name('scoped-roles.status');
        Route::post('/access-requests', [InstitutionGovernanceController::class, 'storeAccessRequest'])->name('access-requests.store');
        Route::post('/access-requests/{accessRequest}/review', [InstitutionGovernanceController::class, 'reviewAccessRequest'])->name('access-requests.review');

        // 3. Platform Configuration: Modules, Feature Flags, Terminology, Policies & Workflow Builder
        Route::get('/modules', [InstitutionGovernanceController::class, 'modules'])->name('modules');
        Route::post('/modules/feature-flags', [InstitutionGovernanceController::class, 'toggleFeatureFlag'])->name('modules.feature-flags');
        Route::post('/modules/college-toggle', [InstitutionGovernanceController::class, 'toggleCollegeModule'])->name('modules.college-toggle');

        Route::get('/terminology', [InstitutionGovernanceController::class, 'terminology'])->name('terminology');
        Route::match(['post', 'put'], '/terminology', [InstitutionGovernanceController::class, 'updateTerminology'])->name('terminology.update');

        Route::get('/policies', [InstitutionGovernanceController::class, 'policies'])->name('policies');
        Route::post('/policies', [InstitutionGovernanceController::class, 'storePolicy'])->name('policies.store');
        Route::put('/policies/{policy}', [InstitutionGovernanceController::class, 'updatePolicy'])->name('policies.update');

        Route::get('/workflows', [InstitutionGovernanceController::class, 'workflows'])->name('workflows');
        Route::post('/workflows', [InstitutionGovernanceController::class, 'storeWorkflow'])->name('workflows.store');
        Route::put('/workflows/{workflow}', [InstitutionGovernanceController::class, 'updateWorkflow'])->name('workflows.update');

        Route::get('/global-defaults', [InstitutionGovernanceController::class, 'globalDefaults'])->name('global-defaults');
        Route::match(['post', 'put'], '/global-defaults', [InstitutionGovernanceController::class, 'updateGlobalDefaults'])->name('global-defaults.update');

        Route::get('/academic-governance', [InstitutionGovernanceController::class, 'academicGovernance'])->name('academic-governance');

        // 4. Data Sources, Integrations & Sync/Reconciliation Standards
        Route::get('/integrations', [InstitutionGovernanceController::class, 'integrations'])->name('integrations');
        Route::match(['post', 'put'], '/integrations/sync-config', [InstitutionGovernanceController::class, 'updateSyncConfig'])->name('integrations.sync-config');

        // 5. Data Quality, Audit Logs, Security/Privacy & Structural Reports
        Route::get('/data-quality', [InstitutionGovernanceController::class, 'dataQuality'])->name('data-quality');
        Route::get('/audit', [InstitutionGovernanceController::class, 'audit'])->name('audit');
        Route::match(['post', 'put'], '/security', [InstitutionGovernanceController::class, 'updateSecuritySettings'])->name('security.update');
        Route::match(['post', 'put'], '/audit/security', [InstitutionGovernanceController::class, 'updateSecuritySettings'])->name('audit.security.update');
        Route::get('/reports', [InstitutionGovernanceController::class, 'reports'])->name('reports');
    });

    // VPAA / Academic Executive Workspace (Vice President for Academic Affairs & Academic Governance)
    Route::prefix('vpaa')->name('vpaa.')->group(function () {
        Route::get('/dashboard', [VpaaAcademicController::class, 'dashboard'])->name('dashboard');
        Route::get('/academic-overview', [VpaaAcademicController::class, 'academicOverview'])->name('academic-overview');
        Route::get('/curriculum-programs', [VpaaAcademicController::class, 'curriculumPrograms'])->name('curriculum-programs');
        Route::get('/faculty-instruction', [VpaaAcademicController::class, 'facultyInstruction'])->name('faculty-instruction');
        Route::get('/scheduling-exams', [VpaaAcademicController::class, 'schedulingExams'])->name('scheduling-exams');
        Route::get('/compliance-quality', [VpaaAcademicController::class, 'complianceQuality'])->name('compliance-quality');
        Route::get('/research-extension', [VpaaAcademicController::class, 'researchExtension'])->name('research-extension');
        Route::get('/reports', [VpaaAcademicController::class, 'reports'])->name('reports');
        // TV & Communications Modules (Clearly separated by purpose)
        Route::get('/tv-executive', [VpaaAcademicController::class, 'tvExecutive'])->name('tv-executive');
        Route::get('/tv-channel-switcher', [VpaaAcademicController::class, 'tvChannelSwitcher'])->name('tv-channel-switcher');
        Route::get('/tv-college-channels', [VpaaAcademicController::class, 'tvCollegeChannels'])->name('tv-college-channels');
        Route::get('/tv-academic-highlights', [VpaaAcademicController::class, 'tvAcademicHighlights'])->name('tv-academic-highlights');
        Route::get('/tv-communications', [VpaaAcademicController::class, 'tvExecutive'])->name('tv-communications');
        Route::post('/tv-communications/promote-slide', [VpaaAcademicController::class, 'promoteSlide'])->name('tv-communications.promote');
    });

    // VPAF / Executive Workspace (Vice President for Administration and Finance)
    Route::prefix('vpaf')->name('vpaf.')->group(function () {
        Route::get('/dashboard', [VpafExecutiveController::class, 'dashboard'])->name('dashboard');
        Route::get('/analytics', [VpafExecutiveController::class, 'analytics'])->name('analytics');
        Route::get('/academic-operations', [VpafExecutiveController::class, 'academicOperations'])->name('academic-operations');
        Route::get('/compliance-quality', [VpafExecutiveController::class, 'complianceQuality'])->name('compliance-quality');
        Route::get('/facilities-resources', [VpafExecutiveController::class, 'facilitiesResources'])->name('facilities-resources');
        Route::get('/research-extension', [VpafExecutiveController::class, 'researchExtension'])->name('research-extension');
        Route::get('/projects-initiatives', [VpafExecutiveController::class, 'projectsInitiatives'])->name('projects-initiatives');
        Route::get('/reports', [VpafExecutiveController::class, 'reports'])->name('reports');
        Route::get('/tv-communications', [VpafExecutiveController::class, 'tvCommunications'])->name('tv-communications');
        Route::post('/tv-communications/takeover', [VpafExecutiveController::class, 'triggerBroadcastTakeover'])->name('tv-communications.takeover');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
