<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Support\Tools\Tools;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates a server-side conversion request against the catalog.
 *
 * Accept/reject rules come from config/tools.php, so a tool cannot be asked to
 * process a file type it does not declare, and the per-tool size ceiling is
 * enforced before a single byte is written to storage.
 */
final class StoreConversionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tool = Tools::tool((string) $this->input('tool'));

        $maxKilobytes = $tool !== null
            ? max(1, (int) ceil($tool->maxBytes / 1024))
            : 51200;

        $mimetypes = $tool !== null && $tool->accepts !== []
            ? 'mimetypes:'.implode(',', $tool->accepts)
            : 'file';

        return [
            'tool' => ['required', 'string', 'max:64'],
            'files' => ['required', 'array', 'min:1', 'max:'.($tool?->multiple === true ? 20 : 1)],
            'files.*' => ['required', 'file', 'max:'.$maxKilobytes, $mimetypes],
            'options' => ['nullable', 'array'],
            'options.output' => ['nullable', 'string', 'max:16'],
            'options.preset' => ['nullable', 'string', 'in:screen,ebook,printer,prepress,default'],
            'options.quality' => ['nullable', 'integer', 'min:1', 'max:100'],
            'options.dpi' => ['nullable', 'integer', 'min:36', 'max:600'],
            'options.width' => ['nullable', 'integer', 'min:1', 'max:20000'],
            'options.height' => ['nullable', 'integer', 'min:1', 'max:20000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tool.required' => 'A tool slug is required.',
            'files.required' => 'Upload at least one file.',
            'files.min' => 'Upload at least one file.',
            'files.max' => 'Too many files were uploaded for this tool.',
            'files.*.max' => 'That file is larger than this tool accepts.',
            'files.*.mimetypes' => 'That file type is not supported by this tool.',
        ];
    }

    /**
     * JSON errors keep the front-end polling loop simple - it never has to
     * parse an HTML error page.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The request could not be accepted.',
            'errors' => $validator->errors()->toArray(),
        ], 422));
    }
}
