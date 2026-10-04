<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Jobs\RecordToolCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class ToolAnalyticsController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tool' => [
                'required',
                'string',
                'max:80',
                'regex:/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/',
                Rule::in(array_keys(config('tools.tools', []))),
            ],
        ]);

        dispatch(new RecordToolCompletion(
            $validated['tool'],
            now()->toDateString(),
            $request->user()?->id,
        ))->onQueue('analytics');

        return response()->json(['recorded' => true], 202);
    }
}
