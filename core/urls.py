from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/<str:username>/', views.profile_view, name='profile'),
    path('messages/', views.messages_view, name='messages'),
    path('conversation/<int:conversation_id>/', views.conversation_view, name='conversation'),
    path('conversation/<int:conversation_id>/messages/', views.get_messages_json, name='get_messages_json'),
    path('message/<int:message_id>/delete/', views.delete_message, name='delete_message'),
    path('user/<int:user_id>/status/', views.get_user_status, name='get_user_status'),
    path('post/<int:post_id>/like/', views.like_post, name='like_post'),
    path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('post/<int:post_id>/comments/', views.get_comments, name='get_comments'),
    path('post/<int:post_id>/delete/', views.delete_post, name='delete_post'),
    path('friend-request/send/<str:username>/', views.send_friend_request, name='send_friend_request'),
    path('friend-request/cancel/<str:username>/', views.cancel_friend_request, name='cancel_friend_request'),
    path('friend-request/accept/<int:request_id>/', views.accept_friend_request, name='accept_friend_request'),
    path('friend-request/reject/<int:request_id>/', views.reject_friend_request, name='reject_friend_request'),
    path('unfriend/<str:username>/', views.unfriend, name='unfriend'),
    path('conversation/start/<str:username>/', views.start_conversation, name='start_conversation'),
    path('find-friends/', views.find_friends_view, name='find_friends'),
    path('friends/', views.all_friends_view, name='all_friends'),
    path('friends/<str:username>/', views.all_friends_view, name='all_friends'),
    
    # Notification URLs
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/json/', views.get_notifications_json, name='get_notifications_json'),
    path('notification/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    path('notification/<int:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    path('notifications/clear-all/', views.clear_all_notifications, name='clear_all_notifications'),
    
    # Group URLs
    path('groups/', views.groups_list_view, name='groups'),
    path('group/create/', views.create_group_view, name='create_group'),
    path('group/<int:group_id>/', views.group_detail_view, name='group_detail'),
    path('group/<int:group_id>/edit/', views.edit_group, name='edit_group'),
    path('group/<int:group_id>/delete/', views.delete_group, name='delete_group'),
    path('group/<int:group_id>/join/', views.join_group, name='join_group'),
    path('group/<int:group_id>/leave/', views.leave_group, name='leave_group'),
    path('group/<int:group_id>/members/', views.group_members_view, name='group_members'),
    
    # Group Admin URLs
    path('group/<int:group_id>/approve/<int:user_id>/', views.approve_join_request, name='approve_join_request'),
    path('group/<int:group_id>/reject/<int:user_id>/', views.reject_join_request, name='reject_join_request'),
    path('group/<int:group_id>/remove/<int:user_id>/', views.remove_member, name='remove_member'),
    path('group/<int:group_id>/make-admin/<int:user_id>/', views.make_admin, name='make_admin'),
    path('group/<int:group_id>/remove-admin/<int:user_id>/', views.remove_admin, name='remove_admin'),
    
    # Group Post URLs
    path('group/<int:group_id>/post/', views.create_group_post, name='create_group_post'),
    path('group/<int:group_id>/post/<int:post_id>/delete/', views.delete_group_post, name='delete_group_post'),
    path('group/<int:group_id>/post/<int:post_id>/pin/', views.pin_group_post, name='pin_group_post'),
    path('group/<int:group_id>/post/<int:post_id>/like/', views.like_group_post, name='like_group_post'),
    path('group/<int:group_id>/post/<int:post_id>/comment/', views.comment_group_post, name='comment_group_post'),
    path('group/<int:group_id>/post/<int:post_id>/comments/', views.get_group_post_comments, name='get_group_post_comments'),
    
    # Share URLs
    path('post/<int:post_id>/share/', views.share_post, name='share_post'),
    path('post/<int:post_id>/unshare/', views.unshare_post, name='unshare_post'),
    path('post/<int:post_id>/share-count/', views.get_share_count, name='get_share_count'),
    
    # Block URLs
    path('block/<str:username>/', views.block_user, name='block_user'),
    path('unblock/<str:username>/', views.unblock_user, name='unblock_user'),
    path('blocked-users/', views.blocked_users_view, name='blocked_users'),
]
