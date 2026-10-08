<?php

namespace App\Http\Controllers;

use App\Models\OfficeRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OfficeRequestController extends Controller
{
    public function index()
    {
        $requests = OfficeRequest::with(['requester', 'resolver'])
            ->latest()
            ->get();

        return Inertia::render('requests/index', [
            'requests' => $requests,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:supplies,maintenance,technical,other',
        ]);

        $validated['requester_id'] = $request->user()->id;
        $validated['status'] = 'pending';

        OfficeRequest::create($validated);

        return redirect()->back()->with('success', 'Request submitted successfully.');
    }

    public function update(Request $request, OfficeRequest $officeRequest)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,rejected',
            'resolution_notes' => 'nullable|string',
        ]);

        if (in_array($validated['status'], ['in_progress', 'completed', 'rejected'])) {
            $validated['resolver_id'] = $request->user()->id;
        }

        $officeRequest->update($validated);

        return redirect()->back()->with('success', 'Request updated successfully.');
    }
}
