package com.documind.service;

import com.documind.dto.AuthDto;

public interface ProfileService {
    AuthDto.UserDto getProfile();
    AuthDto.UserDto updateProfile(String name);
}
