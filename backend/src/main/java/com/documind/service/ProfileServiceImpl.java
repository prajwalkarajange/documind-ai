package com.documind.service;

import com.documind.dto.AuthDto;
import com.documind.entity.Profile;
import com.documind.entity.UserRole;
import com.documind.repository.ProfileRepository;
import com.documind.repository.UserRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuthService authService;

    public ProfileServiceImpl(ProfileRepository profileRepository,
                              UserRoleRepository userRoleRepository,
                              AuthService authService) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.authService = authService;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthDto.UserDto getProfile() {
        return authService.getCurrentUser();
    }

    @Override
    @Transactional
    public AuthDto.UserDto updateProfile(String name) {
        AuthDto.UserDto currentUser = authService.getCurrentUser();
        Profile profile = profileRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        profile.setName(name);
        Profile saved = profileRepository.save(profile);

        List<UserRole> userRoles = userRoleRepository.findByUserId(saved.getId());
        String mainRole = userRoles.stream()
                .map(UserRole::getRole)
                .filter(role -> role.equalsIgnoreCase("ADMIN"))
                .findFirst()
                .orElse("USER");

        return AuthDto.UserDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(mainRole)
                .enabled(saved.isEnabled())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
