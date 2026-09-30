import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';

/** Keep unsaved work safe on both SPA links and browser back/forward. */
export function useUnsavedNavigation(dirty: boolean) {
  const navigate = useNavigate();
  const savedNavigation = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !savedNavigation.current
    && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('저장하지 않은 변경이 있습니다. 변경을 버리고 이동할까요?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => { if (!dirty) savedNavigation.current = false; }, [dirty]);
  return useCallback((to: string) => { savedNavigation.current = true; void navigate(to); }, [navigate]);
}
