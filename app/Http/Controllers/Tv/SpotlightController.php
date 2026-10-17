<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\SpotlightSlide;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SpotlightController extends Controller
{
    public function index(Request $request)
    {
        $query = SpotlightSlide::with(['faculty', 'creator'])->latest();

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('headline', 'like', "%{$search}%")
                    ->orWhere('honoree_name', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%")
                    ->orWhere('event_title', 'like', "%{$search}%")
                    ->orWhere('program_or_department', 'like', "%{$search}%")
                    ->orWhereHas('faculty', function ($fq) use ($search) {
                        $fq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $spotlights = $query->paginate(12)->withQueryString();

        $stats = [
            'total' => SpotlightSlide::count(),
            'published' => SpotlightSlide::where('status', 'published')->count(),
            'active_now' => SpotlightSlide::activeAt()->count(),
            'drafts' => SpotlightSlide::where('status', 'draft')->count(),
            'birthday_count' => SpotlightSlide::where('type', 'birthday')->where('status', 'published')->count(),
        ];

        // Upcoming birthday suggestions (next 14 days)
        $suggestedBirthdays = $this->getSuggestedBirthdays();

        return Inertia::render('tv/spotlight/index', [
            'spotlights' => $spotlights,
            'stats' => $stats,
            'suggested_birthdays' => $suggestedBirthdays,
            'filters' => $request->only(['type', 'status', 'search']),
        ]);
    }

    public function create(Request $request)
    {
        $faculties = Faculty::orderBy('last_name')->get()->map(fn ($f) => [
            'id' => $f->id,
            'name' => $f->full_name,
            'title_name' => $f->title_name,
            'academic_rank' => $f->academic_rank,
            'program_name' => $f->program ? $f->program->name : '',
            'program_code' => $f->program ? $f->program->code : '',
            'photo_url' => $f->photo_url,
            'birth_date' => $f->birth_date ? $f->birth_date->format('Y-m-d') : null,
        ]);

        $programs = Program::orderBy('name')->get();

        $prefill = [
            'type' => $request->get('type', 'achievement'),
            'faculty_id' => $request->get('faculty_id'),
            'honoree_name' => $request->get('honoree_name', ''),
            'honoree_title' => $request->get('honoree_title', ''),
            'program_or_department' => $request->get('program_or_department', ''),
            'headline' => $request->get('headline', ''),
            'message' => $request->get('message', ''),
            'event_title' => $request->get('event_title', ''),
            'awarding_organization' => $request->get('awarding_organization', ''),
            'event_date' => $request->get('event_date', ''),
            'template' => $request->get('template', 'award'),
            'background_style' => $request->get('background_style', 'royal-gold'),
            'accent_style' => $request->get('accent_style', 'gold'),
            'headline_alignment' => $request->get('headline_alignment', 'left'),
            'text_size' => $request->get('text_size', 'normal'),
            'display_duration' => (int) $request->get('display_duration', 20),
            'transition' => $request->get('transition', 'zoom-fade'),
            'layout_mode' => $request->get('layout_mode', 'hero-split'),
            'fullscreen_takeover' => filter_var($request->get('fullscreen_takeover', false), FILTER_VALIDATE_BOOLEAN),
            'playlist' => $request->get('playlist', 'Main TV Rotation'),
            'priority' => (int) $request->get('priority', 1),
            'start_at' => $request->get('start_at', now()->format('Y-m-d\TH:i')),
            'end_at' => $request->get('end_at', now()->addDays(7)->format('Y-m-d\TH:i')),
            'status' => $request->get('status', 'published'),
        ];

        // If faculty_id was provided, resolve additional prefill info
        if ($request->filled('faculty_id')) {
            $faculty = Faculty::find($request->faculty_id);
            if ($faculty) {
                if (empty($prefill['honoree_name'])) {
                    $prefill['honoree_name'] = $faculty->full_name;
                }
                if (empty($prefill['honoree_title'])) {
                    $prefill['honoree_title'] = $faculty->academic_rank ?? '';
                }
                if (empty($prefill['program_or_department']) && $faculty->program) {
                    $prefill['program_or_department'] = $faculty->program->name;
                }
            }
        }

        return Inertia::render('tv/spotlight/create', [
            'faculties' => $faculties,
            'programs' => $programs,
            'prefill' => $prefill,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:award,achievement,birthday,publication,certification,promotion,research,extension,welcome,farewell,custom',
            'faculty_id' => 'nullable|exists:faculties,id',
            'honoree_name' => 'nullable|string|max:255',
            'honoree_title' => 'nullable|string|max:255',
            'program_or_department' => 'nullable|string|max:255',
            'photo' => 'nullable|image|max:10240', // 10MB max
            'headline' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
            'event_title' => 'nullable|string|max:255',
            'awarding_organization' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'template' => 'required|string|max:100',
            'background_style' => 'required|string|max:100',
            'accent_style' => 'required|string|max:100',
            'headline_alignment' => 'required|string|in:left,center,right',
            'text_size' => 'required|string|in:compact,normal,large',
            'display_duration' => 'required|integer|min:5|max:120',
            'transition' => 'required|string|max:100',
            'layout_mode' => 'required|string|in:hero-split,centered-portrait,banner-card,full-bleed',
            'fullscreen_takeover' => 'boolean',
            'playlist' => 'required|string|max:255',
            'priority' => 'required|integer|min:1|max:3',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'status' => 'required|string|in:draft,published,archived',
            'evidence' => 'nullable|file|max:20480', // 20MB max for certificate/documents
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('spotlight_photos', 'public');
        } elseif ($validated['faculty_id'] ?? null) {
            $faculty = Faculty::find($validated['faculty_id']);
            if ($faculty && $faculty->profile_picture) {
                $photoPath = $faculty->profile_picture;
            }
        }

        $evidencePath = null;
        $evidenceName = null;
        if ($request->hasFile('evidence')) {
            $evidenceFile = $request->file('evidence');
            $evidenceName = $evidenceFile->getClientOriginalName();
            $evidencePath = $evidenceFile->store('spotlight_evidence', 'public');
        }

        $spotlight = SpotlightSlide::create([
            'type' => $validated['type'],
            'faculty_id' => $validated['faculty_id'] ?? null,
            'honoree_name' => $validated['honoree_name'] ?? null,
            'honoree_title' => $validated['honoree_title'] ?? null,
            'program_or_department' => $validated['program_or_department'] ?? null,
            'photo_path' => $photoPath,
            'headline' => $validated['headline'],
            'message' => $validated['message'],
            'event_title' => $validated['event_title'] ?? null,
            'awarding_organization' => $validated['awarding_organization'] ?? null,
            'event_date' => $validated['event_date'] ?? null,
            'template' => $validated['template'],
            'background_style' => $validated['background_style'],
            'accent_style' => $validated['accent_style'],
            'headline_alignment' => $validated['headline_alignment'],
            'text_size' => $validated['text_size'],
            'display_duration' => $validated['display_duration'],
            'transition' => $validated['transition'],
            'layout_mode' => $validated['layout_mode'],
            'fullscreen_takeover' => $validated['fullscreen_takeover'] ?? false,
            'playlist' => $validated['playlist'],
            'priority' => $validated['priority'],
            'start_at' => $validated['start_at'] ?? null,
            'end_at' => $validated['end_at'] ?? null,
            'status' => $validated['status'],
            'evidence_path' => $evidencePath,
            'evidence_name' => $evidenceName,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->route('tv-config.spotlight.index')->with('success', "Spotlight Slide \"{$spotlight->headline}\" created successfully.");
    }

    public function edit(SpotlightSlide $spotlight)
    {
        $faculties = Faculty::orderBy('last_name')->get()->map(fn ($f) => [
            'id' => $f->id,
            'name' => $f->full_name,
            'title_name' => $f->title_name,
            'academic_rank' => $f->academic_rank,
            'program_name' => $f->program ? $f->program->name : '',
            'program_code' => $f->program ? $f->program->code : '',
            'photo_url' => $f->photo_url,
            'birth_date' => $f->birth_date ? $f->birth_date->format('Y-m-d') : null,
        ]);

        $programs = Program::orderBy('name')->get();

        return Inertia::render('tv/spotlight/edit', [
            'spotlight' => $spotlight->load('faculty'),
            'faculties' => $faculties,
            'programs' => $programs,
        ]);
    }

    public function update(Request $request, SpotlightSlide $spotlight)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:award,achievement,birthday,publication,certification,promotion,research,extension,welcome,farewell,custom',
            'faculty_id' => 'nullable|exists:faculties,id',
            'honoree_name' => 'nullable|string|max:255',
            'honoree_title' => 'nullable|string|max:255',
            'program_or_department' => 'nullable|string|max:255',
            'photo' => 'nullable|image|max:10240',
            'headline' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
            'event_title' => 'nullable|string|max:255',
            'awarding_organization' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'template' => 'required|string|max:100',
            'background_style' => 'required|string|max:100',
            'accent_style' => 'required|string|max:100',
            'headline_alignment' => 'required|string|in:left,center,right',
            'text_size' => 'required|string|in:compact,normal,large',
            'display_duration' => 'required|integer|min:5|max:120',
            'transition' => 'required|string|max:100',
            'layout_mode' => 'required|string|in:hero-split,centered-portrait,banner-card,full-bleed',
            'fullscreen_takeover' => 'boolean',
            'playlist' => 'required|string|max:255',
            'priority' => 'required|integer|min:1|max:3',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'status' => 'required|string|in:draft,published,archived',
            'evidence' => 'nullable|file|max:20480',
        ]);

        $photoPath = $spotlight->photo_path;
        if ($request->hasFile('photo')) {
            if ($photoPath && Storage::disk('public')->exists($photoPath) && ! str_starts_with($photoPath, 'profile_pictures')) {
                Storage::disk('public')->delete($photoPath);
            }
            $photoPath = $request->file('photo')->store('spotlight_photos', 'public');
        } elseif (! $photoPath && ($validated['faculty_id'] ?? null)) {
            $faculty = Faculty::find($validated['faculty_id']);
            if ($faculty && $faculty->profile_picture) {
                $photoPath = $faculty->profile_picture;
            }
        }

        $evidencePath = $spotlight->evidence_path;
        $evidenceName = $spotlight->evidence_name;
        if ($request->hasFile('evidence')) {
            if ($evidencePath && Storage::disk('public')->exists($evidencePath)) {
                Storage::disk('public')->delete($evidencePath);
            }
            $evidenceFile = $request->file('evidence');
            $evidenceName = $evidenceFile->getClientOriginalName();
            $evidencePath = $evidenceFile->store('spotlight_evidence', 'public');
        }

        $spotlight->update([
            'type' => $validated['type'],
            'faculty_id' => $validated['faculty_id'] ?? null,
            'honoree_name' => $validated['honoree_name'] ?? null,
            'honoree_title' => $validated['honoree_title'] ?? null,
            'program_or_department' => $validated['program_or_department'] ?? null,
            'photo_path' => $photoPath,
            'headline' => $validated['headline'],
            'message' => $validated['message'],
            'event_title' => $validated['event_title'] ?? null,
            'awarding_organization' => $validated['awarding_organization'] ?? null,
            'event_date' => $validated['event_date'] ?? null,
            'template' => $validated['template'],
            'background_style' => $validated['background_style'],
            'accent_style' => $validated['accent_style'],
            'headline_alignment' => $validated['headline_alignment'],
            'text_size' => $validated['text_size'],
            'display_duration' => $validated['display_duration'],
            'transition' => $validated['transition'],
            'layout_mode' => $validated['layout_mode'],
            'fullscreen_takeover' => $validated['fullscreen_takeover'] ?? false,
            'playlist' => $validated['playlist'],
            'priority' => $validated['priority'],
            'start_at' => $validated['start_at'] ?? null,
            'end_at' => $validated['end_at'] ?? null,
            'status' => $validated['status'],
            'evidence_path' => $evidencePath,
            'evidence_name' => $evidenceName,
        ]);

        return redirect()->route('tv-config.spotlight.index')->with('success', 'Spotlight Slide updated successfully.');
    }

    public function destroy(SpotlightSlide $spotlight)
    {
        if ($spotlight->photo_path && ! str_starts_with($spotlight->photo_path, 'profile_pictures')) {
            Storage::disk('public')->delete($spotlight->photo_path);
        }
        if ($spotlight->evidence_path) {
            Storage::disk('public')->delete($spotlight->evidence_path);
        }

        $headline = $spotlight->headline;
        $spotlight->delete();

        return redirect()->back()->with('success', "Spotlight Slide \"{$headline}\" deleted.");
    }

    public function togglePublish(SpotlightSlide $spotlight)
    {
        $newStatus = $spotlight->status === 'published' ? 'draft' : 'published';
        $spotlight->update(['status' => $newStatus]);

        $message = $newStatus === 'published'
            ? "Spotlight \"{$spotlight->headline}\" is now Live on TV rotation."
            : "Spotlight \"{$spotlight->headline}\" set to draft.";

        return redirect()->back()->with('success', $message);
    }

    /**
     * Helper to retrieve approaching faculty birthdays and suggested draft slides.
     */
    protected function getSuggestedBirthdays(): array
    {
        $faculties = Faculty::whereNotNull('birth_date')->get();
        $today = Carbon::today();
        $suggestions = [];

        foreach ($faculties as $faculty) {
            $bday = Carbon::parse($faculty->birth_date);
            // Replace year with current year
            $thisYearBday = Carbon::create($today->year, $bday->month, $bday->day);

            if ($thisYearBday->lt($today->copy()->subDays(1))) {
                $thisYearBday->addYear();
            }

            $diffDays = $today->diffInDays($thisYearBday, false);

            // Within next 14 days
            if ($diffDays >= -1 && $diffDays <= 14) {
                // Check if a birthday spotlight already exists for this faculty in this window
                $existing = SpotlightSlide::where('faculty_id', $faculty->id)
                    ->where('type', 'birthday')
                    ->where('start_at', '>=', $thisYearBday->copy()->subDays(3))
                    ->where('end_at', '<=', $thisYearBday->copy()->addDays(5))
                    ->first();

                $suggestions[] = [
                    'faculty_id' => $faculty->id,
                    'faculty_name' => $faculty->full_name,
                    'title_name' => $faculty->title_name,
                    'program' => $faculty->program ? $faculty->program->name : 'College Faculty',
                    'photo_url' => $faculty->photo_url,
                    'birthday_formatted' => $thisYearBday->format('F j'),
                    'days_away' => $diffDays,
                    'is_today' => $diffDays === 0,
                    'has_active_slide' => (bool) $existing,
                    'existing_slide_id' => $existing?->id,
                    'suggested_start' => $thisYearBday->copy()->subDay()->format('Y-m-d\TH:i'),
                    'suggested_end' => $thisYearBday->copy()->addDays(2)->format('Y-m-d\TH:i'),
                ];
            }
        }

        usort($suggestions, fn ($a, $b) => $a['days_away'] <=> $b['days_away']);

        return $suggestions;
    }
}
