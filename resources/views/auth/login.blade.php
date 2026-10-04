@extends('layouts.app', ['title' => 'Sign in'])

@section('content')
    <section class="card form-card">
        <div class="eyebrow">Welcome back</div>
        <h1 style="font-size:34px">Sign in</h1>
        <p>Access your MyTools profile.</p>
        <form method="POST" action="{{ route('auth.login.store') }}">
            @csrf
            <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="username">
                @error('email')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input id="password" type="password" name="password" required autocomplete="current-password">
                @error('password')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label><input type="checkbox" name="remember" value="1"> Keep me signed in</label>
            </div>
            <button class="btn" type="submit">Sign in</button>
        </form>
        <p class="muted">New here? <a href="{{ route('auth.register') }}">Create an account</a></p>
    </section>
@endsection
