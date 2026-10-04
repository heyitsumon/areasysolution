@extends('layouts.app', ['title' => 'Create account'])

@section('content')
    <section class="card form-card">
        <div class="eyebrow">Get started</div>
        <h1 style="font-size:34px">Create your account</h1>
        <p>Set up your MyTools profile.</p>
        <form method="POST" action="{{ route('auth.register.store') }}">
            @csrf
            <div class="field">
                <label for="name">Name</label>
                <input id="name" name="name" value="{{ old('name') }}" required maxlength="100" autocomplete="name">
                @error('name')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" name="email" value="{{ old('email') }}" required maxlength="255" autocomplete="email">
                @error('email')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input id="password" type="password" name="password" required autocomplete="new-password">
                @error('password')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="password_confirmation">Confirm password</label>
                <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password">
            </div>
            <button class="btn" type="submit">Create account</button>
        </form>
        <p class="muted">Already registered? <a href="{{ route('login') }}">Sign in</a></p>
    </section>
@endsection
