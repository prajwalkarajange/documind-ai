package com.documind.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        // Build a shared WebClient with standard settings
        return builder.codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(20 * 1024 * 1024)).build();
    }
}
