package com.documind.service;

import com.documind.dto.AuthDto;
import com.documind.entity.Profile;
import com.documind.entity.UserRole;
import com.documind.repository.ProfileRepository;
import com.documind.repository.UserRoleRepository;
import com.documind.security.JwtTokenUtil;
import com.documind.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;

    public AuthServiceImpl(ProfileRepository profileRepository,
                           UserRoleRepository userRoleRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtTokenUtil jwtTokenUtil) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @Override
    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (profileRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        Profile profile = Profile.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .build();

        Profile savedProfile = profileRepository.save(profile);

        UserRole userRole = UserRole.builder()
                .user(savedProfile)
                .role("USER")
                .build();
        userRoleRepository.save(userRole);

        // Generate token immediately on registration
        UserPrincipal principal = UserPrincipal.create(savedProfile, List.of("USER"));
        String token = jwtTokenUtil.generateToken(principal);

        return AuthDto.AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(savedProfile, "USER"))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenUtil.generateToken(principal);

        String mainRole = principal.getAuthorities().stream()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .filter(role -> role.equals("ADMIN"))
                .findFirst()
                .orElse("USER");

        return AuthDto.AuthResponse.builder()
                .token(token)
                .user(AuthDto.UserDto.builder()
                        .id(principal.getId())
                        .name(principal.getName())
                        .email(principal.getEmail())
                        .role(mainRole)
                        .enabled(principal.isEnabled())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthDto.UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal() instanceof String) {
            throw new IllegalStateException("No authenticated user session found");
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Profile profile = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        List<UserRole> userRoles = userRoleRepository.findByUserId(profile.getId());
        String mainRole = userRoles.stream()
                .map(UserRole::getRole)
                .filter(role -> role.equalsIgnoreCase("ADMIN"))
                .findFirst()
                .orElse("USER");

        return mapToUserDto(profile, mainRole);
    }

    private AuthDto.UserDto mapToUserDto(Profile profile, String role) {
        return AuthDto.UserDto.builder()
                .id(profile.getId())
                .name(profile.getName())
                .email(profile.getEmail())
                .role(role)
                .enabled(profile.isEnabled())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
