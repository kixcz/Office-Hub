<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\CustomContentSlide;
use App\Models\TvDevice;
use App\Models\TvPublicationLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CustomSlideController extends Controller
{
    public function index(Request $request)
    {
        $query = CustomContentSlide::with(['creator', 'updater'])->latest();

        if ($request->filled('layout') && $request->layout !== 'all') {
            $query->where('layout', $request->layout);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->activeAt();
            } elseif ($request->status === 'expired') {
                $query->where('status', 'published')
                    ->where('auto_expire', true)
                    ->where('end_at', '<', Carbon::now());
            } elseif ($request->status === 'scheduled') {
                $query->where('status', 'published')
                    ->where('start_at', '>', Carbon::now());
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('badge', 'like', "%{$search}%");
            });
        }

        if ($request->filled('playlist') && $request->playlist !== 'all') {
            $query->where('playlist', $request->playlist);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('start_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('end_at', '<=', $request->end_date);
        }

        if ($request->filled('sort')) {
            if ($request->sort === 'oldest') {
                $query->oldest();
            } elseif ($request->sort === 'duration_asc') {
                $query->orderBy('duration_seconds', 'asc');
            } elseif ($request->sort === 'duration_desc') {
                $query->orderBy('duration_seconds', 'desc');
            } elseif ($request->sort === 'title') {
                $query->orderBy('title', 'asc');
            }
        }

        $slides = $query->paginate(12)->withQueryString();

        $playlists = CustomContentSlide::select('playlist')
            ->whereNotNull('playlist')
            ->distinct()
            ->pluck('playlist');

        $stats = [
            'total' => CustomContentSlide::count(),
            'published' => CustomContentSlide::where('status', 'published')->count(),
            'active_now' => CustomContentSlide::activeAt()->count(),
            'drafts' => CustomContentSlide::where('status', 'draft')->count(),
            'expired' => CustomContentSlide::where('status', 'published')
                ->where('auto_expire', true)
                ->where('end_at', '<', Carbon::now())
                ->count(),
            'scheduled' => CustomContentSlide::where('status', 'published')
                ->where('start_at', '>', Carbon::now())
                ->count(),
        ];

        return Inertia::render('tv/custom/index', [
            'slides' => $slides,
            'stats' => $stats,
            'playlists' => $playlists,
            'filters' => (object) $request->only(['layout', 'status', 'playlist', 'start_date', 'end_date', 'sort', 'search']),
        ]);
    }

    public function create(Request $request)
    {
        $devices = TvDevice::orderBy('name')->get();

        return Inertia::render('tv/custom/create', [
            'devices' => $devices,
            'initial_layout' => $request->query('layout', 'title_table'),
            'initial_theme' => $request->query('theme', 'slate-clean'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'subtitle' => 'nullable|string|max:200',
            'badge' => 'nullable|string|max:60',
            'layout' => 'required|string|in:blank,title_table,bulletin,two_column,image_text,qr_instructions,full_image',
            'theme' => 'required|string',
            'header_alignment' => 'required|string|in:left,center',
            'content_blocks' => 'nullable|array',
            'primary_image' => 'nullable|image|max:10240',
            'primary_image_fit' => 'nullable|string|in:cover,contain,fill',
            'qr_url' => 'nullable|string|max:500',
            'qr_label' => 'nullable|string|max:100',
            'duration_seconds' => 'required|integer|min:5|max:120',
            'playlist' => 'required|string|max:100',
            'target_display_id' => 'nullable|string',
            'priority' => 'required|integer|min:1|max:3',
            'fullscreen_takeover' => 'boolean',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date',
            'auto_expire' => 'boolean',
            'status' => 'required|string|in:draft,published,archived',
        ]);

        $imagePath = null;
        if ($request->hasFile('primary_image')) {
            $imagePath = $request->file('primary_image')->store('custom_slides', 'public');
        }

        $user = $request->user();

        $slide = CustomContentSlide::create([
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'layout' => $validated['layout'],
            'theme' => $validated['theme'],
            'header_alignment' => $validated['header_alignment'],
            'content_blocks' => $validated['content_blocks'] ?? [],
            'primary_image_path' => $imagePath,
            'primary_image_fit' => $validated['primary_image_fit'] ?? 'cover',
            'qr_url' => $validated['qr_url'] ?? null,
            'qr_label' => $validated['qr_label'] ?? null,
            'duration_seconds' => $validated['duration_seconds'],
            'playlist' => $validated['playlist'],
            'target_display_id' => $validated['target_display_id'] ?? null,
            'priority' => $validated['priority'],
            'fullscreen_takeover' => $validated['fullscreen_takeover'] ?? false,
            'start_at' => $validated['start_at'] ?? null,
            'end_at' => $validated['end_at'] ?? null,
            'auto_expire' => $validated['auto_expire'] ?? true,
            'status' => $validated['status'],
            'created_by' => $user?->id,
            'updated_by' => $user?->id,
            'published_at' => $validated['status'] === 'published' ? Carbon::now() : null,
        ]);

        // Record in TvPublicationLog if published
        if ($slide->status === 'published') {
            TvPublicationLog::create([
                'version' => 'v'.time(),
                'action' => 'published',
                'target_type' => 'Custom Slide',
                'target_name' => $slide->title,
                'user_id' => $user?->id,
                'publisher_name' => $user ? $user->name : 'System Admin',
                'summary' => "Published Custom Manual Slide \"{$slide->title}\" ({$slide->layout}) to rotation",
                'snapshot_after' => $slide->toArray(),
            ]);
        }

        return redirect()->route('tv-config.custom.index')->with('success', "Custom Slide \"{$slide->title}\" created successfully.");
    }

    public function edit(CustomContentSlide $custom)
    {
        $devices = TvDevice::orderBy('name')->get();

        return Inertia::render('tv/custom/edit', [
            'slide' => $custom->load(['creator', 'updater']),
            'devices' => $devices,
        ]);
    }

    public function update(Request $request, CustomContentSlide $custom)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'subtitle' => 'nullable|string|max:200',
            'badge' => 'nullable|string|max:60',
            'layout' => 'required|string|in:blank,title_table,bulletin,two_column,image_text,qr_instructions,full_image',
            'theme' => 'required|string',
            'header_alignment' => 'required|string|in:left,center',
            'content_blocks' => 'nullable|array',
            'primary_image' => 'nullable|image|max:10240',
            'primary_image_fit' => 'nullable|string|in:cover,contain,fill',
            'qr_url' => 'nullable|string|max:500',
            'qr_label' => 'nullable|string|max:100',
            'duration_seconds' => 'required|integer|min:5|max:120',
            'playlist' => 'required|string|max:100',
            'target_display_id' => 'nullable|string',
            'priority' => 'required|integer|min:1|max:3',
            'fullscreen_takeover' => 'boolean',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date',
            'auto_expire' => 'boolean',
            'status' => 'required|string|in:draft,published,archived',
        ]);

        $imagePath = $custom->primary_image_path;
        if ($request->hasFile('primary_image')) {
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $request->file('primary_image')->store('custom_slides', 'public');
        }

        $user = $request->user();
        $oldStatus = $custom->status;

        $custom->update([
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'layout' => $validated['layout'],
            'theme' => $validated['theme'],
            'header_alignment' => $validated['header_alignment'],
            'content_blocks' => $validated['content_blocks'] ?? $custom->content_blocks,
            'primary_image_path' => $imagePath,
            'primary_image_fit' => $validated['primary_image_fit'] ?? $custom->primary_image_fit,
            'qr_url' => $validated['qr_url'] ?? null,
            'qr_label' => $validated['qr_label'] ?? null,
            'duration_seconds' => $validated['duration_seconds'],
            'playlist' => $validated['playlist'],
            'target_display_id' => $validated['target_display_id'] ?? null,
            'priority' => $validated['priority'],
            'fullscreen_takeover' => $validated['fullscreen_takeover'] ?? false,
            'start_at' => $validated['start_at'] ?? null,
            'end_at' => $validated['end_at'] ?? null,
            'auto_expire' => $validated['auto_expire'] ?? true,
            'status' => $validated['status'],
            'updated_by' => $user?->id,
            'published_at' => ($validated['status'] === 'published' && ! $custom->published_at) ? Carbon::now() : $custom->published_at,
        ]);

        if ($oldStatus !== 'published' && $custom->status === 'published') {
            TvPublicationLog::create([
                'version' => 'v'.time(),
                'action' => 'published',
                'target_type' => 'Custom Slide',
                'target_name' => $custom->title,
                'user_id' => $user?->id,
                'publisher_name' => $user ? $user->name : 'System Admin',
                'summary' => "Published Custom Slide \"{$custom->title}\" to live rotation",
                'snapshot_after' => $custom->toArray(),
            ]);
        }

        return redirect()->route('tv-config.custom.index')->with('success', "Custom Slide \"{$custom->title}\" updated successfully.");
    }

    public function destroy(CustomContentSlide $custom)
    {
        $title = $custom->title;
        if ($custom->primary_image_path && Storage::disk('public')->exists($custom->primary_image_path)) {
            Storage::disk('public')->delete($custom->primary_image_path);
        }

        $custom->delete();

        return redirect()->route('tv-config.custom.index')->with('success', "Custom Slide \"{$title}\" deleted.");
    }

    public function togglePublish(CustomContentSlide $custom)
    {
        $newStatus = $custom->status === 'published' ? 'draft' : 'published';
        $custom->update([
            'status' => $newStatus,
            'published_at' => $newStatus === 'published' ? Carbon::now() : $custom->published_at,
        ]);

        $label = $newStatus === 'published' ? 'published to rotation' : 'moved to drafts';

        return back()->with('success', "Slide \"{$custom->title}\" {$label}.");
    }

    /**
     * Duplicate an existing custom slide for quick reuse
     */
    public function duplicate(CustomContentSlide $custom, Request $request)
    {
        $user = $request->user();

        $clone = $custom->replicate([
            'published_at',
            'created_at',
            'updated_at',
        ]);

        $clone->title = 'Copy of '.$custom->title;
        $clone->status = 'draft';
        $clone->created_by = $user?->id;
        $clone->updated_by = $user?->id;
        $clone->save();

        return redirect()->route('tv-config.custom.edit', $clone->id)->with('success', "Duplicated \"{$custom->title}\" as a new draft.");
    }
}
