-- CreateTable
CREATE TABLE `AppRoleOnUser` (
    `user_id` BIGINT NOT NULL,
    `role` ENUM('ADMIN', 'FACILITATOR') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `completed_onboarding` BOOLEAN NOT NULL DEFAULT false,
    `email` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `real_name` VARCHAR(191) NOT NULL,
    `profile_image` VARCHAR(191) NOT NULL,
    `slack_id` VARCHAR(191) NOT NULL,
    `slack_team_id` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_slack_id_key`(`slack_id`),
    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_slack_id_slack_team_id_idx`(`slack_id`, `slack_team_id`),
    INDEX `User_slack_id_idx`(`slack_id`),
    INDEX `User_username_idx`(`username`),
    UNIQUE INDEX `User_slack_id_slack_team_id_key`(`slack_id`, `slack_team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_by_id` BIGINT NOT NULL,
    `gcal_calendar_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slack_team_id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'INDETERMINATE') NOT NULL DEFAULT 'ACTIVE',
    `visibility` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Project_slug_key`(`slug`),
    INDEX `Project_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `user_id` BIGINT NOT NULL,
    `project_id` BIGINT NOT NULL,
    `added_by_id` BIGINT NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'INDETERMINATE') NOT NULL DEFAULT 'ACTIVE',
    `role` ENUM('OWNER', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'MEMBER',
    `position` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TeamMember_user_id_idx`(`user_id`),
    INDEX `TeamMember_project_id_idx`(`project_id`),
    PRIMARY KEY (`user_id`, `project_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `all_day` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `gcal_event_id` VARCHAR(191) NOT NULL,
    `recurrence` JSON NULL,
    `project_id` BIGINT NOT NULL,
    `created_by_id` BIGINT NOT NULL,
    `slack_channel_id` VARCHAR(191) NOT NULL,
    `slack_team_id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `timezone` VARCHAR(191) NOT NULL,
    `type` ENUM('MEETING') NOT NULL DEFAULT 'MEETING',
    `visibility` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Event_gcal_event_id_key`(`gcal_event_id`),
    UNIQUE INDEX `Event_slug_key`(`slug`),
    INDEX `Event_gcal_event_id_idx`(`gcal_event_id`),
    INDEX `Event_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventException` (
    `event_id` BIGINT NOT NULL,
    `original_start_time` DATETIME(3) NOT NULL,
    `all_day` BOOLEAN NULL,
    `start_time` DATETIME(3) NULL,
    `end_time` DATETIME(3) NULL,
    `gcal_event_id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `status` ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED') NOT NULL,

    UNIQUE INDEX `EventException_gcal_event_id_key`(`gcal_event_id`),
    INDEX `EventException_event_id_idx`(`event_id`),
    INDEX `EventException_original_start_time_idx`(`original_start_time`),
    INDEX `EventException_gcal_event_id_idx`(`gcal_event_id`),
    PRIMARY KEY (`event_id`, `original_start_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventParticipant` (
    `event_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `event_time` DATETIME(3) NOT NULL,
    `added_by_id` BIGINT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventParticipant_user_id_idx`(`user_id`),
    INDEX `EventParticipant_event_id_idx`(`event_id`),
    PRIMARY KEY (`event_id`, `user_id`, `event_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventCheckin` (
    `event_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `event_time` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventCheckin_event_id_idx`(`event_id`),
    INDEX `EventCheckin_user_id_idx`(`user_id`),
    PRIMARY KEY (`event_id`, `user_id`, `event_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
