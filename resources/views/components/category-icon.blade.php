@props([
    'category',
    'size' => 'md',
    'variant' => 'light',
])

@php
    $sizeClasses = match ($size) {
        'sm' => 'size-9 rounded-xl',
        'lg' => 'size-12 rounded-2xl',
        default => 'size-11 rounded-xl',
    };
    $colorClasses = match ($category) {
        'pdf-tools' => 'bg-rose-50 text-rose-600',
        'image-tools' => 'bg-emerald-50 text-emerald-600',
        'text-tools' => 'bg-amber-50 text-amber-600',
        'calculators' => 'bg-violet-50 text-violet-600',
        'developer-tools' => 'bg-blue-50 text-blue-600',
        'seo-tools' => 'bg-orange-50 text-orange-600',
        'business-tools' => 'bg-teal-50 text-teal-600',
        default => 'bg-slate-100 text-slate-600',
    };
    $appearance = $variant === 'dark'
        ? 'border border-white/10 bg-white/10 text-indigo-100'
        : $colorClasses;
@endphp

<span {{ $attributes->class([$sizeClasses, $appearance, 'inline-grid shrink-0 place-items-center']) }} aria-hidden="true">
    <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        @switch($category)
            @case('pdf-tools')
                <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z"/>
                <path d="M14 3.75v4h4M8 15h2a1.5 1.5 0 0 0 0-3H8v5m6-5v5h1.2a2.5 2.5 0 0 0 0-5H14Z"/>
                @break
            @case('image-tools')
                <rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/>
                <circle cx="9" cy="9.5" r="1.5"/>
                <path d="m5 17 4.5-4 3 2.5 2.5-2 4 3.5"/>
                @break
            @case('text-tools')
                <path d="M5 5.5h14M5 9.5h14M5 13.5h9M5 17.5h11"/>
                <path d="M4 3.5h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/>
                @break
            @case('calculators')
                <rect x="5" y="3" width="14" height="18" rx="2.5"/>
                <path d="M8 6.5h8v3H8zM8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/>
                @break
            @case('developer-tools')
                <path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M14 4l-4 16"/>
                @break
            @case('seo-tools')
                <circle cx="10.5" cy="10.5" r="6.5"/>
                <path d="m15.5 15.5 5 5M8 10.5h5M10.5 8v5"/>
                @break
            @case('business-tools')
                <rect x="3.5" y="7" width="17" height="13" rx="2"/>
                <path d="M8 7V5.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 5.5V7M3.5 12h17M10 12v2h4v-2"/>
                @break
            @default
                <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/>
                <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>
        @endswitch
    </svg>
</span>
