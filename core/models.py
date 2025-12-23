from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    bio = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    cover_photo = models.ImageField(upload_to='covers/', blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female')], blank=True)
    relationship_status = models.CharField(max_length=10, choices=[('single', 'Single'), ('married', 'Married')], blank=True)
    last_active = models.DateTimeField(default=timezone.now)
    
    def get_profile_photo_url(self):
        if self.profile_photo:
            return self.profile_photo.url
        return '/media/defaults/default-avatar.jpg'
    
    def get_cover_photo_url(self):
        if self.cover_photo:
            return self.cover_photo.url
        return '/media/defaults/default-cover.jpg'
    
    def is_online(self):
        if not self.last_active:
            return False
        return timezone.now() - self.last_active < timezone.timedelta(minutes=2)
    
    def get_last_active_display(self):
        if self.is_online():
            return 'Active now'
        
        if not self.last_active:
            return 'Offline'
        
        diff = timezone.now() - self.last_active
        
        if diff.days > 0:
            return f'Active {diff.days}d ago'
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f'Active {hours}h ago'
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f'Active {minutes}m ago'
        else:
            return 'Active just now'


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} on {self.post}"


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('post', 'user')
    
    def __str__(self):
        return f"{self.user.username} likes {self.post}"


class Friendship(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('user', 'friend')
    
    def __str__(self):
        return f"{self.user.username} & {self.friend.username}"


class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('from_user', 'to_user')
    
    def __str__(self):
        return f"{self.from_user.username} → {self.to_user.username}"


class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username} in {self.conversation}"
    
    def get_attachment_url(self):
        if self.attachment:
            return self.attachment.url
        return None
    
    def is_image(self):
        if self.attachment:
            ext = self.attachment.name.lower().split('.')[-1]
            return ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']
        return False


# ==================== GROUP MODELS ====================

class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    cover_photo = models.ImageField(upload_to='group_covers/', blank=True, null=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_private = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def get_cover_photo_url(self):
        if self.cover_photo:
            return self.cover_photo.url
        return '/media/defaults/default-group-cover.jpg'
    
    def member_count(self):
        return self.memberships.filter(status='approved').count()
    
    def is_member(self, user):
        return self.memberships.filter(user=user, status='approved').exists()
    
    def is_admin(self, user):
        return self.memberships.filter(user=user, role__in=['admin', 'creator'], status='approved').exists()
    
    def is_creator(self, user):
        return self.creator == user
    
    def get_admins(self):
        return User.objects.filter(
            group_memberships__group=self,
            group_memberships__role__in=['admin', 'creator'],
            group_memberships__status='approved'
        )
    
    def get_members(self):
        return User.objects.filter(
            group_memberships__group=self,
            group_memberships__status='approved'
        )
    
    def get_pending_requests(self):
        return self.memberships.filter(status='pending')


class GroupMembership(models.Model):
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('admin', 'Admin'),
        ('creator', 'Creator'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='approved')
    joined_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('group', 'user')
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.group.name} ({self.role})"


class GroupPost(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='posts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_posts')
    content = models.TextField()
    image = models.ImageField(upload_to='group_posts/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_pinned = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.group.name} - {self.created_at}"


class GroupComment(models.Model):
    post = models.ForeignKey(GroupPost, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_comments')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} on {self.post}"


class GroupLike(models.Model):
    post = models.ForeignKey(GroupPost, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_likes')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('post', 'user')
    
    def __str__(self):
        return f"{self.user.username} likes {self.post}"


# ==================== NOTIFICATION MODEL ====================

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Request Accepted'),
        ('post_like', 'Post Like'),
        ('post_comment', 'Post Comment'),
        ('post_share', 'Post Shared'),
        ('message', 'New Message'),
        ('group_invite', 'Group Invitation'),
        ('group_join_request', 'Group Join Request'),
        ('group_join_approved', 'Group Join Approved'),
        ('group_join_rejected', 'Group Join Rejected'),
        ('group_post', 'New Group Post'),
        ('group_comment', 'Group Post Comment'),
        ('group_like', 'Group Post Like'),
        ('group_admin', 'Made Group Admin'),
        ('group_removed', 'Removed from Group'),
        ('group_role_change', 'Group Role Changed'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    # Optional foreign keys for related objects
    related_post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    related_group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True)
    related_group_post = models.ForeignKey(GroupPost, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"
    
    @classmethod
    def create_notification(cls, recipient, sender, notification_type, title, message='', link='', **kwargs):
        """Helper method to create notifications"""
        if recipient != sender:  # Don't notify users about their own actions
            return cls.objects.create(
                recipient=recipient,
                sender=sender,
                notification_type=notification_type,
                title=title,
                message=message,
                link=link,
                **kwargs
            )
        return None


# ==================== SHARE MODEL ====================

class SharedPost(models.Model):
    """Track when users share posts to their profile"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_posts')
    original_post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='shares')
    caption = models.TextField(blank=True)  # Optional caption when sharing
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'original_post')  # User can only share a post once
    
    def __str__(self):
        return f"{self.user.username} shared {self.original_post}"


# ==================== BLOCK MODEL ====================

class Block(models.Model):
    """Track blocked users"""
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('blocker', 'blocked')
    
    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"
    
    @classmethod
    def is_blocked(cls, user1, user2):
        """Check if either user has blocked the other"""
        return cls.objects.filter(
            models.Q(blocker=user1, blocked=user2) | 
            models.Q(blocker=user2, blocked=user1)
        ).exists()
    
    @classmethod
    def get_blocked_user_ids(cls, user):
        """Get IDs of users that this user has blocked or been blocked by"""
        blocked_ids = set(cls.objects.filter(blocker=user).values_list('blocked_id', flat=True))
        blocked_by_ids = set(cls.objects.filter(blocked=user).values_list('blocker_id', flat=True))
        return blocked_ids | blocked_by_ids

