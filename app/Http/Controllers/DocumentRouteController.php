<?php

namespace App\Http\Controllers;

use App\Models\DocumentRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class DocumentRouteController extends Controller
{
    public function index(Request $request)
    {
        $documents = DocumentRoute::with('logger')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('documents/index', [
            'documents' => $documents
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:incoming,outgoing,internal',
            'status' => 'required|in:received,in_review,signed,released',
            'current_location' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $validated['tracking_number'] = strtoupper(Str::random(10));
        $validated['logged_by'] = $request->user()->id;

        DocumentRoute::create($validated);

        return back()->with('success', 'Document logged successfully.');
    }

    public function update(Request $request, DocumentRoute $document)
    {
        $validated = $request->validate([
            'status' => 'required|in:received,in_review,signed,released',
            'current_location' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $document->update($validated);

        return back()->with('success', 'Document status updated.');
    }
}
