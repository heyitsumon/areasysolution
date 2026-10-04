@extends('layouts.app', ['title' => 'Your profile'])

@section('content')
    <section class="hero">
        <div class="eyebrow">Account</div>
        <h1 style="font-size:42px">Your profile</h1>
        <p>Manage your account details and password.</p>
    </section>
    <section class="card form-card" style="margin-left:0">
        <form method="POST" action="{{ route('profile.update') }}">
            @csrf
            @method('PUT')
            <div class="field">
                <label for="name">Name</label>
                <input id="name" name="name" value="{{ old('name', $user->name) }}" required maxlength="100" autocomplete="name">
                @error('name')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" name="email" value="{{ old('email', $user->email) }}" required maxlength="255" autocomplete="email">
                @error('email')<div class="error">{{ $message }}</div>@enderror
            </div>
            <hr style="border:0;border-top:1px solid #edf0f5;margin:24px 0">
            <h2>Change password</h2>
            <p class="muted">Leave these fields blank to keep your current password.</p>
            <div class="field">
                <label for="current_password">Current password</label>
                <input id="current_password" type="password" name="current_password" autocomplete="current-password">
                @error('current_password')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="password">New password</label>
                <input id="password" type="password" name="password" autocomplete="new-password">
                @error('password')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="password_confirmation">Confirm new password</label>
                <input id="password_confirmation" type="password" name="password_confirmation" autocomplete="new-password">
            </div>
            <button class="btn" type="submit">Save profile</button>
        </form>
    </section>
@endsection
