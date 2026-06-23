# Task Progress - Error Identification and Resolution

## Errors Found

1. **API Path Mismatch - Check Active Session**: Frontend calls `/playthrough/check_active/` but backend defines it as `/playthrough/check-session/`
2. **API Path Mismatch - Token Refresh**: Axios interceptor calls `/accounts/token/refresh/` but backend defines it as `/api/token/refresh/`
3. **API Path Mismatch - Playthrough Session**: Frontend calls `/playthrough/{topicId}/` but backend defines it as `/playthrough/sessions/{topic_id}/`
4. **Bug in `submit_answer` helper**: Returns a `Response` object (DRF response) instead of a dict when answer is too long, which will crash the caller
5. **Incomplete session metadata response**: `check_active_session_api` view doesn't return `difficulty`, `modifiers`, or `equipped_item` fields that the Dashboard expects

## Fix Plan
- [x] Identify all errors
- [ ] Fix #1: Update Dashboard.jsx to call `/playthrough/check-session/` instead of `/playthrough/check_active/`
- [ ] Fix #2: Update axios.js to call `/api/token/refresh/` instead of `/accounts/token/refresh/`
- [ ] Fix #3: Update Playthrough.jsx to call `/playthrough/sessions/{topicId}/` instead of `/playthrough/{topicId}/`
- [ ] Fix #4: Fix `submit_answer` to raise validation error instead of returning Response
- [ ] Fix #5: Update `check_active_session_api` to return session metadata fields
- [ ] Verify all fixes