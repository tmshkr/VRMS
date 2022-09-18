# MongoDB Data Overview

This document exists to help with understanding the data stored in MongoDB.

Entities in the [Prisma schema](./prisma/schema.prisma) are referenced, e.g., `User`.

## Collections

### agendaJobs

Scheduled Agenda jobs.

### unconnectedAccounts

Provided data for users who have signed in but have not connected their account via the Slack app.

### userProfiles

Profile data for users.

**Primary key** -> `User.id`

Example:

```
{
    "_id" : 1,
    "headline" : "Full-Stack Engineer"
    "readme" : "# This is my personal README\n\nIt's in ***markdown***",
    "createdAt" : ISODate("2022-09-12T06:31:00.058Z"),
    "updatedAt" : ISODate("2022-09-14T04:34:23.379Z"),
}
```

### meetingDetail

Detailed data for meetings.

**Primary key** -> `Meeting.id`

### projectDetail

Detailed data for projects.

**Primary key** -> `Project.id`
