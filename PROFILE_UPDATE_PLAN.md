# Profile Page Update Plan

## Changes to Make:

1. **Add Friends Section** - Below About section in sidebar
2. **Add Edit Profile Modal** - Like old front-end (modal popup)
3. **Copy profile.js** - From front-end to static/js with Django integration
4. **Update views.py** - Pass friends list to template

## Files to Modify:
- templates/profile.html (complete rebuild)
- static/js/profile.js (new file - copy and adapt)
- core/views.py (add friends to context)

## Implementation Steps:
1. Update profile_view to pass friends list
2. Create new profile.js in static/js/
3. Rebuild profile.html template completely
4. Test all functionality
