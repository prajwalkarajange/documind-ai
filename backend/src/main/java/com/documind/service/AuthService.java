package com.documind.service;

import com.documind.dto.AuthDto;

public interface AuthService {
    AuthDto.AuthResponse register(AuthDto.RegisterRequest request);
    AuthDto.AuthResponse login(AuthDto.LoginRequest request);
    AuthDto.UserDto getCurrentUser();
}
