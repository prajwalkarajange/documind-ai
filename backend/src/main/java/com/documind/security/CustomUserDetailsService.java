package com.documind.security;

import com.documind.entity.Profile;
import com.documind.entity.UserRole;
import com.documind.repository.ProfileRepository;
import com.documind.repository.UserRoleRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;

    public CustomUserDetailsService(ProfileRepository profileRepository, UserRoleRepository userRoleRepository) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        List<UserRole> userRoles = userRoleRepository.findByUserId(profile.getId());
        List<String> roles = userRoles.stream()
                .map(UserRole::getRole)
                .collect(Collectors.toList());

        return UserPrincipal.create(profile, roles);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        List<UserRole> userRoles = userRoleRepository.findByUserId(profile.getId());
        List<String> roles = userRoles.stream()
                .map(UserRole::getRole)
                .collect(Collectors.toList());

        return UserPrincipal.create(profile, roles);
    }
}
