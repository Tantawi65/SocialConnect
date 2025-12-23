from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.utils import timezone
from django.http import JsonResponse
from .models import (
    User, Post, Comment, Like, Friendship, FriendRequest, 
    Conversation, Message, Group, GroupMembership, GroupPost, 
    GroupComment, GroupLike, Notification, SharedPost, Block
)


def signup_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password_confirm = request.POST.get('password_confirm')
        
        if password != password_confirm:
            messages.error(request, 'Passwords do not match')
            return render(request, 'signup.html')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
            return render(request, 'signup.html')
        
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already exists')
            return render(request, 'signup.html')
        
        user = User.objects.create_user(username=username, email=email, password=password)
        
        # Handle profile photo upload
        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']
            user.save()
        
        login(request, user)
        messages.success(request, 'Account created successfully!')
        return redirect('home')
    
    return render(request, 'signup.html')


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            user.last_active = timezone.now()
            user.save(update_fields=['last_active'])
            return redirect('home')
        else:
            messages.error(request, 'Invalid username or password')
    
    return render(request, 'login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def home_view(request):
    if request.method == 'POST':
        content = request.POST.get('content')
        image = request.FILES.get('image')
        
        if content:
            post = Post.objects.create(user=request.user, content=content)
            if image:
                post.image = image
                post.save()
            messages.success(request, 'Post created successfully!')
            return redirect('home')
    
    # Get blocked user IDs
    blocked_ids = Block.get_blocked_user_ids(request.user)
    
    # Get posts from user and friends (excluding blocked users)
    friend_ids = Friendship.objects.filter(user=request.user).values_list('friend_id', flat=True)
    posts = Post.objects.filter(
        Q(user=request.user) | Q(user_id__in=friend_ids)
    ).exclude(user_id__in=blocked_ids)
    
    # Get IDs of users who sent requests to current user
    incoming_request_ids = FriendRequest.objects.filter(to_user=request.user).values_list('from_user_id', flat=True)
    
    # Get suggested users (exclude friends, users who sent requests, and blocked users)
    suggested_users_query = User.objects.exclude(
        id=request.user.id
    ).exclude(
        id__in=friend_ids
    ).exclude(
        id__in=incoming_request_ids
    ).exclude(
        id__in=blocked_ids
    )[:5]
    
    # Get pending request IDs (requests sent by current user)
    pending_request_ids = FriendRequest.objects.filter(from_user=request.user).values_list('to_user_id', flat=True)
    
    # Prepare suggested users with status
    suggested_users = []
    for user in suggested_users_query:
        suggested_users.append({
            'user': user,
            'has_pending_request': user.id in pending_request_ids
        })
    
    context = {
        'posts': posts,
        'user': request.user,
        'suggested_users': suggested_users
    }
    return render(request, 'index.html', context)


@login_required
def profile_view(request, username=None):
    if username:
        profile_user = get_object_or_404(User, username=username)
    else:
        profile_user = request.user
    
    # Check if blocked
    is_blocked = Block.is_blocked(request.user, profile_user)
    has_blocked_user = Block.objects.filter(blocker=request.user, blocked=profile_user).exists()
    is_blocked_by_user = Block.objects.filter(blocker=profile_user, blocked=request.user).exists()
    
    if request.method == 'POST' and profile_user == request.user:
        # Update profile
        profile_user.bio = request.POST.get('bio', '')
        profile_user.location = request.POST.get('location', '')
        profile_user.website = request.POST.get('website', '')
        profile_user.gender = request.POST.get('gender', '')
        profile_user.relationship_status = request.POST.get('relationship_status', '')
        
        if 'profile_photo' in request.FILES:
            profile_user.profile_photo = request.FILES['profile_photo']
        
        if 'cover_photo' in request.FILES:
            profile_user.cover_photo = request.FILES['cover_photo']
        
        profile_user.save()
        messages.success(request, 'Profile updated successfully!')
        return redirect('profile', username=profile_user.username)
    
    # Get posts and shared posts for profile
    own_posts = Post.objects.filter(user=profile_user)
    shared_posts = SharedPost.objects.filter(user=profile_user).select_related('original_post', 'original_post__user')
    
    # Get user's friends
    friend_ids = Friendship.objects.filter(user=profile_user).values_list('friend_id', flat=True)
    friends = User.objects.filter(id__in=friend_ids)[:6]  # Show first 6 friends
    
    # Check friendship status
    is_friend = Friendship.objects.filter(user=request.user, friend=profile_user).exists()
    has_sent_request = FriendRequest.objects.filter(from_user=request.user, to_user=profile_user).exists()
    received_request = FriendRequest.objects.filter(from_user=profile_user, to_user=request.user).first()
    has_received_request = received_request is not None
    
    context = {
        'user': request.user,  # Explicitly add logged-in user for navbar
        'profile_user': profile_user,
        'posts': own_posts,
        'shared_posts': shared_posts,
        'friends': friends,
        'friends_count': Friendship.objects.filter(user=profile_user).count(),
        'is_own_profile': profile_user == request.user,
        'is_friend': is_friend,
        'has_sent_request': has_sent_request,
        'has_received_request': has_received_request,
        'friend_request_id': received_request.id if received_request else None,
        'is_blocked': is_blocked,
        'has_blocked_user': has_blocked_user,
        'is_blocked_by_user': is_blocked_by_user
    }
    return render(request, 'profile.html', context)


@login_required
def messages_view(request):
    # Get all conversations for current user
    conversations = request.user.conversations.all().order_by('-updated_at')
    
    # Get user's friends
    friend_ids = Friendship.objects.filter(user=request.user).values_list('friend_id', flat=True)
    friends = User.objects.filter(id__in=friend_ids)
    
    context = {
        'conversations': conversations,
        'friends': friends,
        'user': request.user
    }
    return render(request, 'messages.html', context)


@login_required
def conversation_view(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
    
    # Get the other participant and check if blocked
    other_user = conversation.participants.exclude(id=request.user.id).first()
    is_blocked = Block.is_blocked(request.user, other_user) if other_user else False
    
    if request.method == 'POST':
        # Check if blocked before allowing message
        if is_blocked:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'Cannot send messages to this user.'})
            messages.error(request, 'Cannot send messages to this user.')
            return redirect('conversation', conversation_id=conversation_id)
        
        content = request.POST.get('content', '')
        attachment = request.FILES.get('attachment')
        
        if content or attachment:
            message = Message.objects.create(
                conversation=conversation, 
                sender=request.user, 
                content=content
            )
            if attachment:
                message.attachment = attachment
                message.save()
            
            # Update sender's last_active
            request.user.last_active = timezone.now()
            request.user.save(update_fields=['last_active'])
            
            conversation.updated_at = timezone.now()
            conversation.save()
            
            # Create notification for the other user
            if other_user:
                Notification.create_notification(
                    recipient=other_user,
                    sender=request.user,
                    notification_type='message',
                    title=f'New message from {request.user.username}',
                    message=content[:100] + '...' if len(content) > 100 else content,
                    link=f'/conversation/{conversation.id}/'
                )
            
            # If AJAX request, return success
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'X-CSRFToken' in request.headers:
                from django.http import JsonResponse
                return JsonResponse({'success': True})
            
            return redirect('conversation', conversation_id=conversation_id)
    
    messages_list = conversation.messages.all().order_by('created_at')
    # Mark messages as read
    messages_list.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
    
    context = {
        'conversation': conversation,
        'messages': messages_list,
        'user': request.user,
        'other_user': other_user,
        'is_blocked': is_blocked
    }
    return render(request, 'conversation.html', context)


@login_required
def get_messages_json(request, conversation_id):
    from django.http import JsonResponse
    conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
    messages_list = conversation.messages.all().order_by('created_at')
    
    # Mark messages as read
    messages_list.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
    
    messages_data = []
    for msg in messages_list:
        messages_data.append({
            'id': msg.id,
            'content': msg.content,
            'sender_username': msg.sender.username,
            'sender_avatar': msg.sender.get_profile_photo_url(),
            'is_own': msg.sender == request.user,
            'created_at': msg.created_at.strftime('%I:%M %p'),
            'has_attachment': bool(msg.attachment),
            'attachment_url': msg.get_attachment_url(),
            'is_image': msg.is_image()
        })
    
    return JsonResponse({'messages': messages_data})


@login_required
def delete_message(request, message_id):
    from django.http import JsonResponse
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=400)
    
    message = get_object_or_404(Message, id=message_id, sender=request.user)
    message.delete()
    
    return JsonResponse({'success': True})


@login_required
def get_user_status(request, user_id):
    from django.http import JsonResponse
    user = get_object_or_404(User, id=user_id)
    return JsonResponse({
        'is_online': user.is_online(),
        'status': user.get_last_active_display()
    })


@login_required
def like_post(request, post_id):
    from django.http import JsonResponse
    
    post = get_object_or_404(Post, id=post_id)
    like, created = Like.objects.get_or_create(post=post, user=request.user)
    
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
        # Create notification for post owner
        if post.user != request.user:
            Notification.create_notification(
                recipient=post.user,
                sender=request.user,
                notification_type='post_like',
                title=f'{request.user.username} liked your post',
                message=f'{request.user.username} liked your post.',
                link='/',
                related_post=post
            )
    
    like_count = post.likes.count()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
        return JsonResponse({
            'success': True,
            'liked': liked,
            'like_count': like_count
        })
    
    return redirect('home')


@login_required
def add_comment(request, post_id):
    from django.http import JsonResponse
    
    if request.method == 'POST':
        post = get_object_or_404(Post, id=post_id)
        content = request.POST.get('content')
        
        if content:
            comment = Comment.objects.create(post=post, user=request.user, content=content)
            
            # Create notification for post owner
            if post.user != request.user:
                Notification.create_notification(
                    recipient=post.user,
                    sender=request.user,
                    notification_type='post_comment',
                    title=f'{request.user.username} commented on your post',
                    message=f'{request.user.username} commented: "{content[:50]}..."' if len(content) > 50 else f'{request.user.username} commented: "{content}"',
                    link='/',
                    related_post=post
                )
            
            # If AJAX request, return JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'X-CSRFToken' in request.headers:
                return JsonResponse({
                    'success': True,
                    'comment': {
                        'id': comment.id,
                        'content': comment.content,
                        'user': comment.user.username,
                        'avatar': comment.user.get_profile_photo_url(),
                        'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    'comment_count': post.comments.count()
                })
    
    return redirect('home')


@login_required
def get_comments(request, post_id):
    from django.http import JsonResponse
    
    post = get_object_or_404(Post, id=post_id)
    comments = post.comments.all().order_by('created_at')
    
    comments_data = []
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content,
            'user': comment.user.username,
            'avatar': comment.user.get_profile_photo_url(),
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return JsonResponse({
        'comments': comments_data,
        'count': comments.count()
    })


@login_required
def send_friend_request(request, username):
    to_user = get_object_or_404(User, username=username)
    
    # Check if blocked
    if Block.is_blocked(request.user, to_user):
        messages.error(request, 'Cannot send friend request to this user.')
        return redirect('profile', username=username)
    
    if to_user != request.user:
        friend_req, created = FriendRequest.objects.get_or_create(from_user=request.user, to_user=to_user)
        if created:
            # Create notification for the recipient
            Notification.create_notification(
                recipient=to_user,
                sender=request.user,
                notification_type='friend_request',
                title=f'{request.user.username} sent you a friend request',
                message=f'{request.user.username} wants to be your friend.',
                link=f'/profile/{request.user.username}/'
            )
        messages.success(request, f'Friend request sent to {to_user.username}')
    
    return redirect('profile', username=username)


@login_required
def cancel_friend_request(request, username):
    to_user = get_object_or_404(User, username=username)
    
    # Delete the friend request
    FriendRequest.objects.filter(from_user=request.user, to_user=to_user).delete()
    messages.success(request, f'Friend request to {to_user.username} cancelled')
    
    # Get the referer to redirect back to the same page
    referer = request.META.get('HTTP_REFERER')
    if referer:
        return redirect(referer)
    return redirect('home')


@login_required
def accept_friend_request(request, request_id):
    friend_request = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)
    
    # Create friendship both ways
    Friendship.objects.create(user=request.user, friend=friend_request.from_user)
    Friendship.objects.create(user=friend_request.from_user, friend=request.user)
    
    # Notify the sender that request was accepted
    Notification.create_notification(
        recipient=friend_request.from_user,
        sender=request.user,
        notification_type='friend_accept',
        title=f'{request.user.username} accepted your friend request',
        message=f'You are now friends with {request.user.username}.',
        link=f'/profile/{request.user.username}/'
    )
    
    # Delete the request
    friend_request.delete()
    
    messages.success(request, f'You are now friends with {friend_request.from_user.username}')
    
    # Get the referer to redirect back to the same page
    referer = request.META.get('HTTP_REFERER')
    if referer:
        return redirect(referer)
    return redirect('home')


@login_required
def reject_friend_request(request, request_id):
    friend_request = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)
    
    # Delete the request without creating friendship
    friend_request.delete()
    
    messages.success(request, f'Friend request from {friend_request.from_user.username} declined')
    
    # Get the referer to redirect back to the same page
    referer = request.META.get('HTTP_REFERER')
    if referer:
        return redirect(referer)
    return redirect('home')


@login_required
def unfriend(request, username):
    friend_user = get_object_or_404(User, username=username)
    
    # Delete friendship both ways
    Friendship.objects.filter(user=request.user, friend=friend_user).delete()
    Friendship.objects.filter(user=friend_user, friend=request.user).delete()
    
    messages.success(request, f'You are no longer friends with {friend_user.username}')
    
    # Get the referer to redirect back to the same page
    referer = request.META.get('HTTP_REFERER')
    if referer:
        return redirect(referer)
    return redirect('home')


@login_required
def start_conversation(request, username):
    other_user = get_object_or_404(User, username=username)
    
    # Check if conversation already exists
    conversation = Conversation.objects.filter(participants=request.user).filter(participants=other_user).first()
    
    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)
    
    return redirect('conversation', conversation_id=conversation.id)


@login_required
def find_friends_view(request):
    # Get list of friend IDs
    friend_ids = Friendship.objects.filter(user=request.user).values_list('friend_id', flat=True)
    
    # Get blocked user IDs
    blocked_ids = Block.get_blocked_user_ids(request.user)
    
    # Get IDs of users who sent requests to current user
    incoming_request_ids = FriendRequest.objects.filter(to_user=request.user).values_list('from_user_id', flat=True)
    
    # Get all users except current user, friends, users who sent requests, and blocked users
    all_users = User.objects.exclude(
        id=request.user.id
    ).exclude(
        id__in=friend_ids
    ).exclude(
        id__in=incoming_request_ids
    ).exclude(
        id__in=blocked_ids
    )
    
    # Get list of users who have pending requests (sent by current user)
    pending_request_ids = FriendRequest.objects.filter(from_user=request.user).values_list('to_user_id', flat=True)
    
    # Annotate users with friendship status
    users_list = []
    for user in all_users:
        has_pending_request = user.id in pending_request_ids
        users_list.append({
            'user': user,
            'is_friend': False,  # Already excluded friends
            'has_pending_request': has_pending_request
        })
    
    context = {
        'users': users_list
    }
    return render(request, 'find_friends.html', context)


@login_required
def all_friends_view(request, username=None):
    if username:
        profile_user = get_object_or_404(User, username=username)
    else:
        profile_user = request.user
    
    # Get all friends
    friend_ids = Friendship.objects.filter(user=profile_user).values_list('friend_id', flat=True)
    friends = User.objects.filter(id__in=friend_ids).order_by('username')
    
    context = {
        'profile_user': profile_user,
        'friends': friends,
        'is_own_profile': profile_user == request.user
    }
    return render(request, 'all_friends.html', context)


@login_required
def delete_post(request, post_id):
    from django.http import JsonResponse
    
    if request.method == 'POST':
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user owns the post
        if post.user == request.user:
            post.delete()
            return JsonResponse({'success': True, 'message': 'Post deleted successfully'})
        else:
            return JsonResponse({'success': False, 'message': 'You do not have permission to delete this post'}, status=403)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


# ==================== NOTIFICATION VIEWS ====================

@login_required
def notifications_view(request):
    """View all notifications"""
    notifications = request.user.notifications.all()[:50]
    unread_count = request.user.notifications.filter(is_read=False).count()
    
    context = {
        'notifications': notifications,
        'unread_count': unread_count,
        'user': request.user
    }
    return render(request, 'notifications.html', context)


@login_required
def get_notifications_json(request):
    """API endpoint to get notifications as JSON"""
    notifications = request.user.notifications.all()[:20]
    unread_count = request.user.notifications.filter(is_read=False).count()
    
    notifications_data = []
    for notif in notifications:
        notifications_data.append({
            'id': notif.id,
            'type': notif.notification_type,
            'title': notif.title,
            'message': notif.message,
            'link': notif.link,
            'is_read': notif.is_read,
            'sender_username': notif.sender.username if notif.sender else None,
            'sender_avatar': notif.sender.get_profile_photo_url() if notif.sender else None,
            'created_at': notif.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'time_ago': get_time_ago(notif.created_at)
        })
    
    return JsonResponse({
        'notifications': notifications_data,
        'unread_count': unread_count
    })


def get_time_ago(dt):
    """Helper function to get human-readable time ago"""
    diff = timezone.now() - dt
    if diff.days > 0:
        return f'{diff.days}d ago'
    elif diff.seconds >= 3600:
        return f'{diff.seconds // 3600}h ago'
    elif diff.seconds >= 60:
        return f'{diff.seconds // 60}m ago'
    else:
        return 'Just now'


@login_required
def mark_notification_read(request, notification_id):
    """Mark a single notification as read"""
    notification = get_object_or_404(Notification, id=notification_id, recipient=request.user)
    notification.is_read = True
    notification.save()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    
    if notification.link:
        return redirect(notification.link)
    return redirect('notifications')


@login_required
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    request.user.notifications.filter(is_read=False).update(is_read=True)
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    return redirect('notifications')


@login_required
def delete_notification(request, notification_id):
    """Delete a notification"""
    notification = get_object_or_404(Notification, id=notification_id, recipient=request.user)
    notification.delete()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    return redirect('notifications')


@login_required
def clear_all_notifications(request):
    """Clear all notifications"""
    request.user.notifications.all().delete()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    return redirect('notifications')


# ==================== GROUP VIEWS ====================

@login_required
def groups_list_view(request):
    """View all groups - user's groups and discover new ones"""
    # Check if discover mode
    discover_mode = request.GET.get('discover') == '1'
    
    # User's groups (as member)
    user_group_ids = GroupMembership.objects.filter(
        user=request.user, 
        status='approved'
    ).values_list('group_id', flat=True)
    
    my_groups = Group.objects.filter(id__in=user_group_ids)
    
    # Discover groups (not a member)
    discover_groups = Group.objects.exclude(id__in=user_group_ids).filter(is_private=False)
    
    # If in discover mode, show more discover groups
    if discover_mode:
        discover_groups = discover_groups[:50]  # Show more when in discover mode
    else:
        discover_groups = discover_groups[:10]  # Show limited in regular view
    
    # Pending join requests
    pending_requests = GroupMembership.objects.filter(
        user=request.user,
        status='pending'
    ).values_list('group_id', flat=True)
    
    context = {
        'my_groups': my_groups,
        'discover_groups': discover_groups,
        'pending_requests': list(pending_requests),
        'user': request.user,
        'discover_mode': discover_mode
    }
    return render(request, 'groups.html', context)


@login_required
def create_group_view(request):
    """Create a new group"""
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        is_private = request.POST.get('is_private') == 'on'
        
        if not name:
            messages.error(request, 'Group name is required')
            return render(request, 'create_group.html')
        
        group = Group.objects.create(
            name=name,
            description=description,
            creator=request.user,
            is_private=is_private
        )
        
        if 'cover_photo' in request.FILES:
            group.cover_photo = request.FILES['cover_photo']
            group.save()
        
        # Add creator as a member with creator role
        GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='creator',
            status='approved'
        )
        
        messages.success(request, f'Group "{name}" created successfully!')
        return redirect('group_detail', group_id=group.id)
    
    return render(request, 'create_group.html')


@login_required
def group_detail_view(request, group_id):
    """View group details and posts"""
    group = get_object_or_404(Group, id=group_id)
    
    # Check membership
    membership = GroupMembership.objects.filter(group=group, user=request.user).first()
    is_member = membership and membership.status == 'approved'
    is_admin = membership and membership.role in ['admin', 'creator'] and membership.status == 'approved'
    is_creator = group.creator == request.user
    has_pending_request = membership and membership.status == 'pending'
    
    # Get posts if member or public group
    posts = []
    if is_member or not group.is_private:
        posts = group.posts.all()
    
    # Get members (limit for display)
    members = GroupMembership.objects.filter(group=group, status='approved').select_related('user')[:12]
    
    # Get pending requests if admin
    pending_requests = []
    if is_admin:
        pending_requests = GroupMembership.objects.filter(group=group, status='pending').select_related('user')
    
    context = {
        'group': group,
        'posts': posts,
        'members': members,
        'pending_requests': pending_requests,
        'is_member': is_member,
        'is_admin': is_admin,
        'is_creator': is_creator,
        'has_pending_request': has_pending_request,
        'membership': membership,
        'user': request.user
    }
    return render(request, 'group_detail.html', context)


@login_required
def join_group(request, group_id):
    """Join a group or request to join"""
    group = get_object_or_404(Group, id=group_id)
    
    # Check if already a member
    existing = GroupMembership.objects.filter(group=group, user=request.user).first()
    if existing:
        if existing.status == 'approved':
            messages.info(request, 'You are already a member of this group')
        elif existing.status == 'pending':
            messages.info(request, 'Your join request is pending approval')
        return redirect('group_detail', group_id=group_id)
    
    # Create membership
    if group.is_private:
        # Private group - needs approval
        GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='member',
            status='pending'
        )
        messages.success(request, 'Join request sent! Waiting for admin approval.')
        
        # Notify group admins
        for admin in group.get_admins():
            Notification.create_notification(
                recipient=admin,
                sender=request.user,
                notification_type='group_join_request',
                title=f'{request.user.username} wants to join {group.name}',
                message=f'{request.user.username} has requested to join your group.',
                link=f'/group/{group.id}/',
                related_group=group
            )
    else:
        # Public group - auto approve
        GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='member',
            status='approved'
        )
        messages.success(request, f'You have joined {group.name}!')
    
    return redirect('group_detail', group_id=group_id)


@login_required
def leave_group(request, group_id):
    """Leave a group"""
    group = get_object_or_404(Group, id=group_id)
    membership = get_object_or_404(GroupMembership, group=group, user=request.user)
    
    if membership.role == 'creator':
        messages.error(request, 'As the creator, you cannot leave the group. You can delete it or transfer ownership.')
        return redirect('group_detail', group_id=group_id)
    
    membership.delete()
    messages.success(request, f'You have left {group.name}')
    return redirect('groups')


@login_required
def delete_group(request, group_id):
    """Delete a group (creator only)"""
    group = get_object_or_404(Group, id=group_id, creator=request.user)
    
    if request.method == 'POST':
        group_name = group.name
        group.delete()
        messages.success(request, f'Group "{group_name}" has been deleted')
        return redirect('groups')
    
    return redirect('group_detail', group_id=group_id)


@login_required
def edit_group(request, group_id):
    """Edit group details (admin only)"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_admin(request.user):
        messages.error(request, 'You do not have permission to edit this group')
        return redirect('group_detail', group_id=group_id)
    
    if request.method == 'POST':
        group.name = request.POST.get('name', group.name)
        group.description = request.POST.get('description', group.description)
        group.is_private = request.POST.get('is_private') == 'on'
        
        if 'cover_photo' in request.FILES:
            group.cover_photo = request.FILES['cover_photo']
        
        group.save()
        messages.success(request, 'Group updated successfully!')
        return redirect('group_detail', group_id=group_id)
    
    context = {
        'group': group,
        'user': request.user
    }
    return render(request, 'edit_group.html', context)


# ==================== GROUP ADMIN VIEWS ====================

@login_required
def approve_join_request(request, group_id, user_id):
    """Approve a join request (admin only)"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_admin(request.user):
        messages.error(request, 'You do not have permission to approve requests')
        return redirect('group_detail', group_id=group_id)
    
    membership = get_object_or_404(GroupMembership, group=group, user_id=user_id, status='pending')
    membership.status = 'approved'
    membership.save()
    
    # Notify the user
    Notification.create_notification(
        recipient=membership.user,
        sender=request.user,
        notification_type='group_join_approved',
        title=f'Welcome to {group.name}!',
        message=f'Your request to join {group.name} has been approved.',
        link=f'/group/{group.id}/',
        related_group=group
    )
    
    messages.success(request, f'{membership.user.username} has been approved')
    return redirect('group_detail', group_id=group_id)


@login_required
def reject_join_request(request, group_id, user_id):
    """Reject a join request (admin only)"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_admin(request.user):
        messages.error(request, 'You do not have permission to reject requests')
        return redirect('group_detail', group_id=group_id)
    
    membership = get_object_or_404(GroupMembership, group=group, user_id=user_id, status='pending')
    user = membership.user
    membership.delete()
    
    # Notify the user
    Notification.create_notification(
        recipient=user,
        sender=request.user,
        notification_type='group_join_rejected',
        title=f'Request to join {group.name} declined',
        message=f'Your request to join {group.name} was not approved.',
        link='/groups/',
        related_group=group
    )
    
    messages.success(request, f'{user.username}\'s request has been declined')
    return redirect('group_detail', group_id=group_id)


@login_required
def remove_member(request, group_id, user_id):
    """Remove a member from group (admin only)"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_admin(request.user):
        messages.error(request, 'You do not have permission to remove members')
        return redirect('group_detail', group_id=group_id)
    
    membership = get_object_or_404(GroupMembership, group=group, user_id=user_id)
    
    # Can't remove the creator
    if membership.role == 'creator':
        messages.error(request, 'Cannot remove the group creator')
        return redirect('group_detail', group_id=group_id)
    
    # Only creator can remove admins
    if membership.role == 'admin' and not group.is_creator(request.user):
        messages.error(request, 'Only the creator can remove admins')
        return redirect('group_detail', group_id=group_id)
    
    user = membership.user
    membership.delete()
    
    # Notify the user
    Notification.create_notification(
        recipient=user,
        sender=request.user,
        notification_type='group_removed',
        title=f'Removed from {group.name}',
        message=f'You have been removed from the group {group.name}.',
        link='/groups/',
        related_group=group
    )
    
    messages.success(request, f'{user.username} has been removed from the group')
    return redirect('group_detail', group_id=group_id)


@login_required
def make_admin(request, group_id, user_id):
    """Make a member an admin (creator only)"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_creator(request.user):
        messages.error(request, 'Only the creator can make admins')
        return redirect('group_detail', group_id=group_id)
    
    membership = get_object_or_404(GroupMembership, group=group, user_id=user_id, status='approved')
    
    if membership.role == 'creator':
        messages.error(request, 'Cannot change creator role')
        return redirect('group_detail', group_id=group_id)
    
    membership.role = 'admin'
    membership.save()
    
    # Notify the user
    Notification.create_notification(
        recipient=membership.user,
        sender=request.user,
        notification_type='group_admin',
        title=f'You are now an admin of {group.name}',
        message=f'You have been made an admin of {group.name}.',
        link=f'/group/{group.id}/',
        related_group=group
    )
    
    messages.success(request, f'{membership.user.username} is now an admin')
    return redirect('group_detail', group_id=group_id)


@login_required
def remove_admin(request, group_id, user_id):
    """Remove admin role from a member (creator only)"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_creator(request.user):
        messages.error(request, 'Only the creator can remove admins')
        return redirect('group_detail', group_id=group_id)
    
    membership = get_object_or_404(GroupMembership, group=group, user_id=user_id, role='admin')
    membership.role = 'member'
    membership.save()
    
    # Notify the user
    Notification.create_notification(
        recipient=membership.user,
        sender=request.user,
        notification_type='group_role_change',
        title=f'Role changed in {group.name}',
        message=f'You are no longer an admin of {group.name}.',
        link=f'/group/{group.id}/',
        related_group=group
    )
    
    messages.success(request, f'{membership.user.username} is no longer an admin')
    return redirect('group_detail', group_id=group_id)


@login_required
def group_members_view(request, group_id):
    """View all members of a group"""
    group = get_object_or_404(Group, id=group_id)
    
    # Check if user can view members
    is_member = group.is_member(request.user)
    if group.is_private and not is_member:
        messages.error(request, 'You must be a member to view this group\'s members')
        return redirect('groups')
    
    is_admin = group.is_admin(request.user)
    is_creator = group.is_creator(request.user)
    
    memberships = GroupMembership.objects.filter(
        group=group, 
        status='approved'
    ).select_related('user').order_by('-role', 'joined_at')
    
    context = {
        'group': group,
        'memberships': memberships,
        'is_member': is_member,
        'is_admin': is_admin,
        'is_creator': is_creator,
        'user': request.user
    }
    return render(request, 'group_members.html', context)


# ==================== GROUP POST VIEWS ====================

@login_required
def create_group_post(request, group_id):
    """Create a post in a group"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_member(request.user):
        messages.error(request, 'You must be a member to post in this group')
        return redirect('group_detail', group_id=group_id)
    
    if request.method == 'POST':
        content = request.POST.get('content')
        
        if content:
            post = GroupPost.objects.create(
                group=group,
                user=request.user,
                content=content
            )
            
            if 'image' in request.FILES:
                post.image = request.FILES['image']
                post.save()
            
            # Notify group members (except the poster)
            for membership in group.memberships.filter(status='approved').exclude(user=request.user):
                Notification.create_notification(
                    recipient=membership.user,
                    sender=request.user,
                    notification_type='group_post',
                    title=f'New post in {group.name}',
                    message=f'{request.user.username} posted in {group.name}',
                    link=f'/group/{group.id}/',
                    related_group=group,
                    related_group_post=post
                )
            
            messages.success(request, 'Post created successfully!')
    
    return redirect('group_detail', group_id=group_id)


@login_required
def delete_group_post(request, group_id, post_id):
    """Delete a group post"""
    group = get_object_or_404(Group, id=group_id)
    post = get_object_or_404(GroupPost, id=post_id, group=group)
    
    # Check permissions: post owner or group admin
    if post.user != request.user and not group.is_admin(request.user):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'message': 'Permission denied'}, status=403)
        messages.error(request, 'You do not have permission to delete this post')
        return redirect('group_detail', group_id=group_id)
    
    post.delete()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    
    messages.success(request, 'Post deleted successfully')
    return redirect('group_detail', group_id=group_id)


@login_required
def pin_group_post(request, group_id, post_id):
    """Pin/unpin a group post (admin only)"""
    group = get_object_or_404(Group, id=group_id)
    
    if not group.is_admin(request.user):
        messages.error(request, 'Only admins can pin posts')
        return redirect('group_detail', group_id=group_id)
    
    post = get_object_or_404(GroupPost, id=post_id, group=group)
    post.is_pinned = not post.is_pinned
    post.save()
    
    action = 'pinned' if post.is_pinned else 'unpinned'
    messages.success(request, f'Post {action} successfully')
    return redirect('group_detail', group_id=group_id)


@login_required
def like_group_post(request, group_id, post_id):
    """Like/unlike a group post"""
    group = get_object_or_404(Group, id=group_id)
    post = get_object_or_404(GroupPost, id=post_id, group=group)
    
    if not group.is_member(request.user):
        return JsonResponse({'success': False, 'message': 'Must be a member'}, status=403)
    
    like, created = GroupLike.objects.get_or_create(post=post, user=request.user)
    
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
        # Notify post owner
        if post.user != request.user:
            Notification.create_notification(
                recipient=post.user,
                sender=request.user,
                notification_type='group_like',
                title=f'{request.user.username} liked your post',
                message=f'{request.user.username} liked your post in {group.name}',
                link=f'/group/{group.id}/',
                related_group=group,
                related_group_post=post
            )
    
    return JsonResponse({
        'success': True,
        'liked': liked,
        'like_count': post.likes.count()
    })


@login_required
def comment_group_post(request, group_id, post_id):
    """Add a comment to a group post"""
    group = get_object_or_404(Group, id=group_id)
    post = get_object_or_404(GroupPost, id=post_id, group=group)
    
    if not group.is_member(request.user):
        return JsonResponse({'success': False, 'message': 'Must be a member'}, status=403)
    
    if request.method == 'POST':
        content = request.POST.get('content')
        
        if content:
            comment = GroupComment.objects.create(
                post=post,
                user=request.user,
                content=content
            )
            
            # Notify post owner
            if post.user != request.user:
                Notification.create_notification(
                    recipient=post.user,
                    sender=request.user,
                    notification_type='group_comment',
                    title=f'{request.user.username} commented on your post',
                    message=f'{request.user.username} commented on your post in {group.name}',
                    link=f'/group/{group.id}/',
                    related_group=group,
                    related_group_post=post
                )
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'comment': {
                        'id': comment.id,
                        'content': comment.content,
                        'user': comment.user.username,
                        'avatar': comment.user.get_profile_photo_url(),
                        'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    'comment_count': post.comments.count()
                })
    
    return redirect('group_detail', group_id=group_id)


@login_required
def get_group_post_comments(request, group_id, post_id):
    """Get comments for a group post"""
    group = get_object_or_404(Group, id=group_id)
    post = get_object_or_404(GroupPost, id=post_id, group=group)
    
    comments = post.comments.all().order_by('created_at')
    
    comments_data = []
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content,
            'user': comment.user.username,
            'avatar': comment.user.get_profile_photo_url(),
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return JsonResponse({
        'comments': comments_data,
        'count': comments.count()
    })


# ==================== SHARE VIEWS ====================

@login_required
@login_required
def share_post(request, post_id):
    """Share a post to user's profile"""
    if request.method == 'POST':
        post = get_object_or_404(Post, id=post_id)
        
        # Check if blocked
        if Block.is_blocked(request.user, post.user):
            return JsonResponse({'success': False, 'error': 'Cannot share this post.'})
        
        # Check if already shared
        if SharedPost.objects.filter(user=request.user, original_post=post).exists():
            return JsonResponse({'success': False, 'error': 'You have already shared this post.'})
        
        caption = request.POST.get('caption', '')
        
        shared = SharedPost.objects.create(
            user=request.user,
            original_post=post,
            caption=caption
        )
        
        # Create notification for original post owner
        if post.user != request.user:
            Notification.create_notification(
                recipient=post.user,
                sender=request.user,
                notification_type='post_share',
                title=f'{request.user.username} shared your post',
                message=caption[:100] if caption else 'Shared your post to their profile.',
                link=f'/profile/{request.user.username}/',
                related_post=post
            )
        
        return JsonResponse({
            'success': True, 
            'message': 'Post shared to your profile!',
            'share_count': post.shares.count()
        })
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@login_required
def unshare_post(request, post_id):
    """Remove a shared post from user's profile"""
    if request.method == 'POST':
        post = get_object_or_404(Post, id=post_id)
        
        shared = SharedPost.objects.filter(user=request.user, original_post=post).first()
        if shared:
            shared.delete()
            return JsonResponse({
                'success': True, 
                'message': 'Post removed from your profile.',
                'share_count': post.shares.count()
            })
        
        return JsonResponse({'success': False, 'error': 'Post not found in your shares.'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@login_required
def get_share_count(request, post_id):
    """Get share count for a post"""
    post = get_object_or_404(Post, id=post_id)
    return JsonResponse({'share_count': post.shares.count()})


# ==================== BLOCK VIEWS ====================

@login_required
def block_user(request, username):
    """Block a user"""
    if request.method == 'POST':
        user_to_block = get_object_or_404(User, username=username)
        
        if user_to_block == request.user:
            return JsonResponse({'success': False, 'error': 'You cannot block yourself.'})
        
        # Check if already blocked
        if Block.objects.filter(blocker=request.user, blocked=user_to_block).exists():
            return JsonResponse({'success': False, 'error': 'User is already blocked.'})
        
        # Create block
        Block.objects.create(blocker=request.user, blocked=user_to_block)
        
        # Remove friendship if exists (both directions)
        Friendship.objects.filter(
            Q(user=request.user, friend=user_to_block) | 
            Q(user=user_to_block, friend=request.user)
        ).delete()
        
        # Remove any pending friend requests (both directions)
        FriendRequest.objects.filter(
            Q(from_user=request.user, to_user=user_to_block) |
            Q(from_user=user_to_block, to_user=request.user)
        ).delete()
        
        return JsonResponse({'success': True, 'message': f'{user_to_block.username} has been blocked.'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@login_required
def unblock_user(request, username):
    """Unblock a user"""
    if request.method == 'POST':
        user_to_unblock = get_object_or_404(User, username=username)
        
        block = Block.objects.filter(blocker=request.user, blocked=user_to_unblock).first()
        if block:
            block.delete()
            return JsonResponse({'success': True, 'message': f'{user_to_unblock.username} has been unblocked.'})
        
        return JsonResponse({'success': False, 'error': 'User is not blocked.'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@login_required
def blocked_users_view(request):
    """View list of blocked users"""
    blocked_users = Block.objects.filter(blocker=request.user).select_related('blocked')
    
    context = {
        'blocked_users': blocked_users,
        'user': request.user
    }
    return render(request, 'blocked_users.html', context)

