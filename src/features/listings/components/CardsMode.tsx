'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownWideNarrow, ArrowLeftRight, ChevronLeft, ChevronRight, ExternalLink, Heart, MapPin, Undo2, X } from 'lucide-react';
import MapGL, { AttributionControl, Marker } from 'react-map-gl/mapbox';
import { Listing } from '@/lib/types';
import { formatSqft } from '@/lib/utils/format';
import { DEFAULT_COLLECTION_ID, useSavedStore } from '@/store/savedStore';
import { useListingSave } from '@/features/listings/hooks/useListingSave';
import { cn } from '@/lib/utils/cn';
import { getMapboxToken } from '@/lib/mapbox';
import Button from '@/components/ui/Button';
import OverlayCloseButton from '@/components/navigation/OverlayCloseButton';
import MobileDrawer from '@/components/ui/MobileDrawer';
import AnchoredPopover from '@/components/ui/AnchoredPopover';
import DesktopSortMenu from '@/components/ui/DesktopSortMenu';
import HeartDelight from '@/components/ui/HeartDelight';
import SaveToCollectionSheet from '@/features/collections/components/SaveToCollectionSheet';
import SortOptionsDrawer from '@/components/ui/SortOptionsDrawer';
import MapListingPin from '@/features/listings/components/MapListingPin';
import PriceText from '@/features/listings/components/PriceText';
import {
  CARDS_MODE_SORT_OPTIONS,
  FALLBACK_LISTING_IMAGES,
  type CardsModeSortMode,
  getCardsModeListingImages,
  sortCardsModeListings,
} from '@/features/listings/lib/cardsModeData';
import { useDocumentOverscrollLock } from '@/hooks/useDocumentOverscrollLock';
import CardModeListingCard, { type CardSwipeAction } from '@/features/listings/components/CardModeListingCard';

const MAPBOX_TOKEN = getMapboxToken();
const SWIPE_EXIT_DURATION = 480;
const STACK_VISIBLE_COUNT = 3;
const DESKTOP_IMAGE_SWIPE_THRESHOLD = 34;
const DESKTOP_IMAGE_WHEEL_LOCK_MS = 720;
const CARD_MODE_ONBOARDING_STORAGE_KEY = 'homes-card-mode-onboarding-seen';
const CARD_MODE_DESKTOP_TIP_STORAGE_KEY = 'homes-card-mode-desktop-tip-seen';
const CARD_MODE_LAST_COLLECTION_STORAGE_KEY = 'homes-card-mode-last-collection-id';
const ACTION_BUTTON_CLASS =
  'flex h-12 items-center gap-2 rounded-full bg-white px-6 type-label shadow-[var(--shadow-control)] transition-all outline-none no-select hover:-translate-y-0.5 hover:bg-[var(--color-surface)] hover:shadow-[0_10px_28px_rgba(15,23,41,0.14)] active:scale-95';
const DESKTOP_ACTION_BUTTON_LABEL_CLASS = 'text-[18px] leading-none xl:text-[19px] 2xl:text-[20px]';
const DESKTOP_CARD_SURFACE_SELECTOR = '[data-desktop-card-surface="true"], [data-desktop-card-controls="true"], [data-card-overlay-control="true"]';
const DESKTOP_CARD_VARIANTS = {
  enter: (direction: 1 | -1) => ({ y: `${direction * 104}vh`, opacity: 1, scale: 1, zIndex: 1 }),
  center: { y: 0, opacity: 1, scale: 1, zIndex: 1 },
  exit: (direction: 1 | -1) => ({ y: `${-direction * 104}vh`, opacity: 1, scale: 1, zIndex: 2 }),
};

interface CardsModeProps {
  listings: Listing[];
  onClose: () => void;
}

export default function CardsMode({ listings, onClose }: CardsModeProps) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(360);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const [desktopSortAnchorRect, setDesktopSortAnchorRect] = useState<DOMRect | null>(null);
  const [sortMode, setSortMode] = useState<CardsModeSortMode>('recommended');
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);
  const [savePickerListing, setSavePickerListing] = useState<Listing | null>(null);
  const [savePickerAnchorRect, setSavePickerAnchorRect] = useState<DOMRect | null>(null);
  const [savePickerMode, setSavePickerMode] = useState<'commit' | 'change'>('commit');
  const [quickSavePrompt, setQuickSavePrompt] = useState<{ listing: Listing; collectionName: string } | null>(null);
  const [desktopImageIndex, setDesktopImageIndex] = useState(0);
  const [desktopImageAutoplay, setDesktopImageAutoplay] = useState(true);
  const [desktopImageZoomKey, setDesktopImageZoomKey] = useState('');
  const [desktopCardDirection, setDesktopCardDirection] = useState<1 | -1>(1);
  const [exitingCard, setExitingCard] = useState<{ listing: Listing; action: CardSwipeAction; startX: number; token: number } | null>(null);
  const [enteringListingId, setEnteringListingId] = useState<string | null>(null);
  const [activeSwipePreview, setActiveSwipePreview] = useState<CardSwipeAction | null>(null);
  const [heartDelightKey, setHeartDelightKey] = useState(0);
  const [showDesktopTip, setShowDesktopTip] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(CARD_MODE_DESKTOP_TIP_STORAGE_KEY) !== 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(CARD_MODE_ONBOARDING_STORAGE_KEY) !== 'true';
  });
  const [preferredCollectionId, setPreferredCollectionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(CARD_MODE_LAST_COLLECTION_STORAGE_KEY);
  });
  const wheelLockRef = useRef(false);
  const imageWheelLockRef = useRef(false);
  const desktopImagePointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const desktopImagePointerMoved = useRef(false);
  const desktopImageAreaRef = useRef<HTMLDivElement>(null);
  const desktopImageStripRef = useRef<HTMLDivElement>(null);
  const activeDragRef = useRef(false);
  const swipeLockRef = useRef(false);
  const exitTokenRef = useRef(0);
  const commitCardExitRef = useRef<((action: CardSwipeAction) => void) | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const collections = useSavedStore((state) => state.collections);
  const saveListing = useSavedStore((state) => state.saveListing);
  const addToCollection = useSavedStore((state) => state.addToCollection);
  const swipeDislike = useSavedStore((state) => state.swipeDislike);

  const [sessionListings] = useState(() => listings);
  const sortedListings = useMemo(() => sortCardsModeListings(sessionListings, sortMode), [sessionListings, sortMode]);
  const activeIndex = Math.min(currentIndex, Math.max(0, sortedListings.length - 1));
  const listing = sortedListings[activeIndex];
  const { isSaved: liked, unsave } = useListingSave(listing?.id ?? '');
  const detailDrawerListing = drawerListing ?? listing;
  const mapDrawerListing = drawerListing ?? listing;
  const visibleListings = useMemo(
    () => sortedListings.slice(activeIndex, activeIndex + STACK_VISIBLE_COUNT),
    [activeIndex, sortedListings]
  );
  const fallbackCollection = useMemo(
    () => collections.find((collection) => collection.id !== DEFAULT_COLLECTION_ID) ?? collections[0],
    [collections]
  );
  const quickSaveCollection = useMemo(
    () => collections.find((collection) => collection.id === preferredCollectionId) ?? fallbackCollection,
    [collections, fallbackCollection, preferredCollectionId]
  );

  const getActiveDesktopImageElements = useCallback(() => {
    if (typeof document === 'undefined' || !listing) {
      return { area: desktopImageAreaRef.current, strip: desktopImageStripRef.current };
    }
    const activeCards = Array.from(document.querySelectorAll<HTMLElement>('[data-desktop-card-active="true"]'));
    const activeCard = activeCards.find((card) => card.dataset.desktopListingId === listing.id) ?? activeCards.at(-1);
    return {
      area: activeCard?.querySelector<HTMLDivElement>('[data-desktop-image-area="true"]') ?? desktopImageAreaRef.current,
      strip: activeCard?.querySelector<HTMLDivElement>('[data-desktop-image-strip="true"]') ?? desktopImageStripRef.current,
    };
  }, [listing]);
  useDocumentOverscrollLock({ x: true, y: true });

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const updateMode = () => setIsDesktop(query.matches);
    updateMode();
    query.addEventListener('change', updateMode);
    return () => query.removeEventListener('change', updateMode);
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      setCardWidth(Math.max(292, window.innerWidth - 16));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const node = stackRef.current;
    if (!node) return;
    let start: { x: number; y: number } | null = null;
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
        event.preventDefault();
      }
    };
    node.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    return () => {
      node.removeEventListener('touchstart', handleTouchStart, { capture: true });
      node.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sortedListings.slice(activeIndex, activeIndex + 3).forEach((item) => {
      getCardsModeListingImages(item).forEach((src) => {
        const image = new window.Image();
        image.src = src;
      });
    });
  }, [activeIndex, sortedListings]);

  useEffect(() => {
    const { area, strip } = getActiveDesktopImageElements();
    if (!strip) return;
    const width = area?.offsetWidth ?? 760;
    strip.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    strip.style.transform = `translateX(${-desktopImageIndex * width}px)`;
  }, [desktopImageIndex, getActiveDesktopImageElements]);

  useEffect(() => {
    if (!isDesktop || !listing || !desktopImageAutoplay || savePickerListing || desktopSortAnchorRect) return;
    const imageCount = getCardsModeListingImages(listing).length;
    if (imageCount <= 1 || desktopImageIndex >= imageCount - 1) return;
    const timer = window.setTimeout(() => {
      setDesktopImageIndex((index) => Math.min(index + 1, imageCount - 1));
    }, desktopImageIndex === 0 ? 5200 : 3800);
    return () => window.clearTimeout(timer);
  }, [desktopImageAutoplay, desktopImageIndex, desktopSortAnchorRect, isDesktop, listing, savePickerListing]);

  useEffect(() => {
    if (!isDesktop || !listing || !desktopImageAutoplay) return;
    const nextZoomKey = `${listing.id}:${desktopImageIndex}`;
    const frame = window.requestAnimationFrame(() => {
      setDesktopImageZoomKey(nextZoomKey);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [desktopImageAutoplay, desktopImageIndex, isDesktop, listing]);

  useEffect(() => {
    if (!quickSavePrompt) return;
    if (savePickerMode === 'change' && savePickerListing) return;
    const timer = window.setTimeout(() => {
      setQuickSavePrompt(null);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [quickSavePrompt, savePickerListing, savePickerMode]);

  const dismissOnboarding = useCallback(() => {
    if (!showOnboarding) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CARD_MODE_ONBOARDING_STORAGE_KEY, 'true');
    }
    setShowOnboarding(false);
  }, [showOnboarding]);

  const dismissDesktopTip = useCallback(() => {
    if (!showDesktopTip) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CARD_MODE_DESKTOP_TIP_STORAGE_KEY, 'true');
    }
    setShowDesktopTip(false);
  }, [showDesktopTip]);

  const passListing = () => {
    if (swipeLockRef.current) return;
    dismissDesktopTip();
    setActiveSwipePreview('pass');
    window.setTimeout(() => commitCardExit('pass'), 340);
  };

  const openSavePicker = (targetListing = listing, anchorRect: DOMRect | null = null) => {
    if (!targetListing || swipeLockRef.current) return;
    dismissOnboarding();
    activeDragRef.current = true;
    setSavePickerMode('commit');
    setSavePickerAnchorRect(anchorRect);
    setSavePickerListing(targetListing);
    window.setTimeout(() => {
      activeDragRef.current = false;
    }, 120);
  };

  const openChangeCollectionPicker = (targetListing: Listing) => {
    dismissOnboarding();
    dismissDesktopTip();
    setSavePickerMode('change');
    const promptRect =
      typeof document === 'undefined'
        ? null
        : document.querySelector('[data-quick-save-prompt="true"]')?.getBoundingClientRect() ?? null;
    setSavePickerAnchorRect(promptRect);
    setSavePickerListing(targetListing);
  };

  const rememberCollection = (collectionId: string) => {
    setPreferredCollectionId(collectionId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CARD_MODE_LAST_COLLECTION_STORAGE_KEY, collectionId);
    }
  };

  const quickSaveListing = (targetListing = listing, startX = 0, exitDelay = 520) => {
    if (!targetListing || !quickSaveCollection || swipeLockRef.current) return;
    dismissOnboarding();
    dismissDesktopTip();
    rememberCollection(quickSaveCollection.id);
    setHeartDelightKey((key) => key + 1);
    if (exitDelay <= 0) {
      setActiveSwipePreview(null);
      commitCardExit('save', targetListing, startX);
      window.setTimeout(() => {
        setQuickSavePrompt({ listing: targetListing, collectionName: quickSaveCollection.name });
      }, 180);
      window.setTimeout(() => {
        saveListing(targetListing.id);
        addToCollection(quickSaveCollection.id, targetListing.id);
      }, SWIPE_EXIT_DURATION);
      return;
    }
    saveListing(targetListing.id);
    addToCollection(quickSaveCollection.id, targetListing.id);
    setQuickSavePrompt({ listing: targetListing, collectionName: quickSaveCollection.name });
    setActiveSwipePreview('save');
    window.setTimeout(() => {
      setActiveSwipePreview(null);
      commitCardExit('save', targetListing, startX);
    }, exitDelay);
  };

  const toggleHeartSave = () => {
    if (swipeLockRef.current || !listing) return;
    if (liked) {
      unsave();
      setQuickSavePrompt(null);
      setActiveSwipePreview(null);
      return;
    }
    quickSaveListing();
  };

  const resetDesktopGalleryForCardTransition = () => {
    if (desktopImageStripRef.current) {
      desktopImageStripRef.current.style.transition = 'none';
      desktopImageStripRef.current.style.transform = 'translateX(0px)';
    }
    setDesktopImageIndex(0);
    setDesktopImageAutoplay(true);
  };

  const commitCardExit = (action: CardSwipeAction, targetListing = listing, startX = 0) => {
    if (!targetListing || swipeLockRef.current) return;
    dismissOnboarding();
    swipeLockRef.current = true;
    activeDragRef.current = true;
    setActiveSwipePreview(null);
    if (action === 'pass') {
      swipeDislike(targetListing.id);
    }
    const nextExitToken = exitTokenRef.current + 1;
    exitTokenRef.current = nextExitToken;
    setDesktopCardDirection(1);
    setExitingCard({ listing: targetListing, action, startX, token: nextExitToken });
    resetDesktopGalleryForCardTransition();
    setCurrentIndex((i) => i + 1);
    window.setTimeout(() => {
      swipeLockRef.current = false;
    }, 360);
    window.setTimeout(() => {
      setExitingCard(null);
      setEnteringListingId(null);
      window.setTimeout(() => {
        activeDragRef.current = false;
      }, 80);
    }, SWIPE_EXIT_DURATION);
  };

  useEffect(() => {
    commitCardExitRef.current = commitCardExit;
  });

  const navigateCard = useCallback((direction: 'next' | 'previous') => {
    if (swipeLockRef.current) return;
    dismissOnboarding();
    setDesktopCardDirection(direction === 'next' ? 1 : -1);
    resetDesktopGalleryForCardTransition();
    setCurrentIndex((index) => {
      if (direction === 'next') return Math.min(sortedListings.length, index + 1);
      const previousIndex = Math.max(0, index - 1);
      setEnteringListingId(sortedListings[previousIndex]?.id ?? null);
      return previousIndex;
    });
  }, [dismissOnboarding, sortedListings]);

  const passCurrentListing = useCallback(() => {
    if (swipeLockRef.current) return;
    dismissDesktopTip();
    setActiveSwipePreview('pass');
    window.setTimeout(() => commitCardExitRef.current?.('pass'), 340);
  }, [dismissDesktopTip]);

  const handleTrackWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 24) return;
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    if (event.deltaX > 0) commitCardExit('pass');
    else openSavePicker();
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 900);
  };

  const handleDesktopWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || Math.abs(event.deltaY) < 32) return;
    if (wheelLockRef.current || swipeLockRef.current) return;
    wheelLockRef.current = true;
    if (event.deltaY > 0) {
      passCurrentListing();
    } else {
      navigateCard('previous');
    }
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 660);
  };

  const showDesktopImageAt = useCallback((index: number, imageCount: number) => {
    setDesktopImageAutoplay(false);
    const nextIndex = Math.max(0, Math.min(index, imageCount - 1));
    const { area, strip } = getActiveDesktopImageElements();
    const width = area?.offsetWidth ?? 760;
    if (strip) {
      strip.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      strip.style.transform = `translateX(${-nextIndex * width}px)`;
    }
    setDesktopImageIndex(nextIndex);
  }, [getActiveDesktopImageElements]);

  const showDesktopImage = useCallback((direction: 'next' | 'previous', imageCount: number) => {
    const nextIndex = direction === 'next'
      ? Math.min(desktopImageIndex + 1, imageCount - 1)
      : Math.max(desktopImageIndex - 1, 0);
    showDesktopImageAt(nextIndex, imageCount);
  }, [desktopImageIndex, showDesktopImageAt]);

  const handleDesktopImageWheel = (event: React.WheelEvent<HTMLDivElement>, imageCount: number) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 18) return;
    event.preventDefault();
    event.stopPropagation();
    setDesktopImageAutoplay(false);
    if (imageWheelLockRef.current) return;
    imageWheelLockRef.current = true;
    showDesktopImage(event.deltaX > 0 ? 'next' : 'previous', imageCount);
    window.setTimeout(() => {
      imageWheelLockRef.current = false;
    }, DESKTOP_IMAGE_WHEEL_LOCK_MS);
  };

  const handleDesktopImagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setDesktopImageAutoplay(false);
    desktopImagePointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    desktopImagePointerMoved.current = false;
    if (desktopImageStripRef.current) {
      const computed = getComputedStyle(desktopImageStripRef.current).transform;
      desktopImageStripRef.current.style.transition = 'none';
      desktopImageStripRef.current.style.transform =
        computed !== 'none'
          ? computed
          : `translateX(${-desktopImageIndex * (desktopImageAreaRef.current?.offsetWidth ?? 760)}px)`;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDesktopImagePointerMove = (event: React.PointerEvent<HTMLDivElement>, imageCount: number) => {
    event.stopPropagation();
    const start = desktopImagePointerStart.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) desktopImagePointerMoved.current = true;
    if (!desktopImageStripRef.current || imageCount <= 1) return;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) return;
    const width = desktopImageAreaRef.current?.offsetWidth ?? 760;
    let constrainedDx = dx;
    if (desktopImageIndex === 0 && dx > 0) {
      constrainedDx = Math.pow(Math.abs(dx), 0.65) * Math.sign(dx);
    } else if (desktopImageIndex === imageCount - 1 && dx < 0) {
      constrainedDx = -Math.pow(Math.abs(dx), 0.65);
    }
    desktopImageStripRef.current.style.transition = 'none';
    const maxSwipeDistance = width;
    constrainedDx = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, constrainedDx));
    desktopImageStripRef.current.style.transform = `translateX(${-desktopImageIndex * width + constrainedDx}px)`;
  };

  const handleDesktopImagePointerUp = (event: React.PointerEvent<HTMLDivElement>, imageCount: number) => {
    event.stopPropagation();
    const start = desktopImagePointerStart.current;
    if (!start || start.id !== event.pointerId) return;
    desktopImagePointerStart.current = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const width = desktopImageAreaRef.current?.offsetWidth ?? 760;
    if (Math.abs(dx) < DESKTOP_IMAGE_SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
      if (desktopImageStripRef.current) {
        desktopImageStripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        desktopImageStripRef.current.style.transform = `translateX(${-desktopImageIndex * width}px)`;
      }
      return;
    }
    const nextIndex =
      dx < 0 && desktopImageIndex < imageCount - 1
        ? desktopImageIndex + 1
        : dx > 0 && desktopImageIndex > 0
        ? desktopImageIndex - 1
        : desktopImageIndex;
    if (nextIndex !== desktopImageIndex) {
      if (desktopImageStripRef.current) {
        desktopImageStripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        desktopImageStripRef.current.style.transform = `translateX(${-nextIndex * width}px)`;
      }
      setDesktopImageIndex(nextIndex);
    } else if (desktopImageStripRef.current) {
      desktopImageStripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      desktopImageStripRef.current.style.transform = `translateX(${-desktopImageIndex * width}px)`;
    }
  };

  useEffect(() => {
    if (!isDesktop) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showMapDrawer || showDetailDrawer || showSortDrawer || savePickerListing || desktopSortAnchorRect) return;
      if (event.key === 'Escape') {
        dismissOnboarding();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        passCurrentListing();
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        navigateCard('previous');
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showDesktopImage('next', getCardsModeListingImages(listing).length);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showDesktopImage('previous', getCardsModeListingImages(listing).length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    desktopSortAnchorRect,
    dismissOnboarding,
    isDesktop,
    listing,
    navigateCard,
    onClose,
    passCurrentListing,
    savePickerListing,
    showDetailDrawer,
    showMapDrawer,
    showSortDrawer,
    showDesktopImage,
  ]);

  if (!listing) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5">
        <span className="text-5xl">🏠</span>
        <div className="text-center">
          <p className="type-subtitle text-[var(--color-text-primary)]">You&apos;ve seen everything</p>
          <p className="mt-1 type-body text-[var(--color-text-tertiary)]">You&apos;ve reached the end of this card stack. Jump back to the map to keep exploring.</p>
        </div>
        <button onClick={onClose} className="rounded-full bg-[var(--color-text-primary)] px-5 py-3 type-btn text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]">
          Back to map
        </button>
      </div>
    );
  }

  if (isDesktop) {
    const desktopImages = getCardsModeListingImages(listing);
    const isSortOpen = !!desktopSortAnchorRect;

    return (
      <motion.div
        className="fixed inset-0 z-[90] hidden cursor-pointer bg-[#F7F7F2] p-3 text-[var(--color-text-primary)] lg:flex lg:flex-col xl:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onWheel={handleDesktopWheel}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest(DESKTOP_CARD_SURFACE_SELECTOR)) return;
          dismissOnboarding();
          onClose();
        }}
      >
        <Button
          variant="elevated"
          shape="circle"
          size="control"
          onClick={() => {
            dismissOnboarding();
            onClose();
          }}
          aria-label="Close cards view"
          data-card-overlay-control="true"
          className="absolute right-[1.35rem] top-3 z-[100] xl:right-[1.6rem] xl:top-4"
        >
          <X size={20} strokeWidth={2.3} />
        </Button>

        <div className="relative mx-auto flex min-h-0 w-[calc(100%-8.5rem)] max-w-[1540px] flex-1 flex-col justify-center gap-5">
          <div className="pointer-events-none absolute bottom-[7.25rem] left-1/2 z-0 h-10 w-[calc(100%-2.8rem)] max-w-[1490px] -translate-x-1/2 rounded-[22px] bg-white/32 shadow-[0_6px_18px_rgba(15,23,41,0.045)]" />
          <div className="pointer-events-none absolute bottom-[6.95rem] left-1/2 z-0 h-10 w-[calc(100%-5.2rem)] max-w-[1430px] -translate-x-1/2 rounded-[20px] bg-white/18 shadow-[0_5px_14px_rgba(15,23,41,0.035)]" />
          <div
            data-desktop-card-surface="true"
            className="relative z-10 cursor-default lg:h-[calc(100vh-150px)]"
          >
            <AnimatePresence initial={false} custom={desktopCardDirection}>
              <motion.div
                key={listing.id}
                data-desktop-card-surface="true"
                data-desktop-card-active="true"
                data-desktop-listing-id={listing.id}
                custom={desktopCardDirection}
                className="absolute inset-0 grid min-h-0 cursor-default overflow-hidden rounded-[26px] bg-white shadow-[0_18px_54px_rgba(15,23,41,0.13)] will-change-transform transform-gpu lg:grid-cols-[minmax(0,2.8fr)_minmax(315px,0.58fr)] xl:grid-cols-[minmax(0,3.25fr)_minmax(340px,0.58fr)]"
                variants={DESKTOP_CARD_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  y: { duration: 0.74, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.74, ease: [0.4, 0, 0.2, 1] },
                }}
              >
              <div
                ref={desktopImageAreaRef}
                data-card-image="true"
                data-desktop-image-area="true"
                className="group relative min-h-0 overflow-hidden bg-[var(--color-surface)]"
                onWheel={(event) => handleDesktopImageWheel(event, desktopImages.length)}
                onPointerDown={handleDesktopImagePointerDown}
                onPointerMove={(event) => handleDesktopImagePointerMove(event, desktopImages.length)}
                onPointerUp={(event) => handleDesktopImagePointerUp(event, desktopImages.length)}
                onPointerCancel={() => {
                  desktopImagePointerStart.current = null;
                  const width = desktopImageAreaRef.current?.offsetWidth ?? 760;
                  if (desktopImageStripRef.current) {
                    desktopImageStripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    desktopImageStripRef.current.style.transform = `translateX(${-desktopImageIndex * width}px)`;
                  }
                }}
                style={{ touchAction: 'none' }}
              >
                <div
                  ref={desktopImageStripRef}
                  data-desktop-image-strip="true"
                  className="flex h-full"
                  style={{ width: `${desktopImages.length * 100}%`, willChange: 'transform' }}
                >
                  {desktopImages.map((src, index) => (
                    <div key={`${listing.id}-${src}-${index}`} className="relative h-full flex-shrink-0" style={{ width: `${100 / desktopImages.length}%` }}>
                      <motion.div
                        className="absolute inset-0"
                        animate={{ scale: desktopImageZoomKey === `${listing.id}:${desktopImageIndex}` && index === desktopImageIndex ? 1.045 : 1 }}
                        transition={{ duration: desktopImageAutoplay ? 4.2 : 0.18, delay: desktopImageAutoplay && index === desktopImageIndex ? 0.35 : 0, ease: 'easeOut' }}
                      >
                        <DesktopListingImage
                          src={src}
                          alt={index === 0 ? listing.address : ''}
                          fallbackIndex={index}
                          eager={index < 2}
                        />
                      </motion.div>
                    </div>
                  ))}
                </div>

                {desktopImages.length > 1 && (
                  <div className="pointer-events-none absolute inset-x-5 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-between opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 lg:flex">
                    {desktopImageIndex > 0 ? (
                      <Button
                        variant="overlay"
                        shape="circle"
                        size="md"
                        aria-label="Previous image"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          showDesktopImage('previous', desktopImages.length);
                        }}
                      >
                        <ChevronLeft size={19} />
                      </Button>
                    ) : <span />}
                    {desktopImageIndex < desktopImages.length - 1 ? (
                      <Button
                        variant="overlay"
                        shape="circle"
                        size="md"
                        aria-label="Next image"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          showDesktopImage('next', desktopImages.length);
                        }}
                      >
                        <ChevronRight size={19} />
                      </Button>
                    ) : <span />}
                  </div>
                )}

                {desktopImages.length > 1 && (
                  <div className="pointer-events-none absolute left-0 right-0 top-3 z-20 flex flex-col items-center gap-1.5">
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: Math.min(desktopImages.length, 8) }, (_, index) => (
                        <span
                          key={`${listing.id}-dot-${index}`}
                          className={cn(
                            'h-1.5 rounded-full bg-white/60 transition-all duration-200',
                            index === desktopImageIndex ? 'w-5 bg-white' : 'w-1.5',
                            desktopImages.length > 8 && index === 7 && desktopImageIndex >= 7 && 'w-5 bg-white'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {desktopImages.length > 1 && (
                  <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full bg-white/68 px-2.5 py-1 type-caption font-semibold text-[var(--color-text-primary)] shadow-[0_8px_20px_rgba(15,23,41,0.12)] backdrop-blur">
                    {desktopImageIndex + 1}/{desktopImages.length}
                  </div>
                )}

                <div className="absolute bottom-4 left-1/2 z-10 flex max-w-[84%] -translate-x-1/2 gap-1 overflow-hidden rounded-lg bg-white/62 p-1.5 shadow-[0_10px_28px_rgba(15,23,41,0.16)] backdrop-blur">
                  {getDesktopThumbnailImages(desktopImages).map(({ src, index }) => (
                    <button
                      key={`${listing.id}-thumb-${src}-${index}`}
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerMove={(event) => event.stopPropagation()}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        showDesktopImageAt(index, desktopImages.length);
                      }}
                      onPointerCancel={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        showDesktopImageAt(index, desktopImages.length);
                      }}
                      className={cn(
                        'relative h-9 w-12 shrink-0 overflow-hidden rounded-md border transition-all',
                        index === desktopImageIndex
                          ? 'scale-105 border-white opacity-100 ring-2 ring-white shadow-[0_0_0_1px_rgba(15,23,41,0.18),0_6px_16px_rgba(15,23,41,0.2)]'
                          : 'border-white/40 opacity-55 hover:opacity-90'
                      )}
                      aria-label={`Show image ${index + 1}`}
                    >
                      <DesktopListingImage src={src} alt="" fallbackIndex={index} />
                    </button>
                  ))}
                </div>

                {(activeSwipePreview === 'pass' || activeSwipePreview === 'save') && (
                  <DesktopSwipeStamp action={activeSwipePreview} />
                )}
              </div>

              <div className="flex min-h-0 flex-col p-5 xl:p-6">
                <div className="shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-[1.8rem] font-semibold leading-none tracking-normal text-[var(--color-text-primary)] xl:text-[2.05rem]"><PriceText price={listing.price} /></p>
                      <p className="mt-1 type-body text-[var(--color-text-secondary)]">
                        {listing.beds}bd · {listing.baths}ba · {formatSqft(listing.sqft)} sqft
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-surface)] px-3 py-1.5 type-caption text-[var(--color-text-secondary)]">
                      {listing.daysOnMarket}d
                    </span>
                  </div>
                  <p className="mt-3 flex items-start gap-1.5 type-caption leading-relaxed text-[var(--color-text-tertiary)]">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span>{listing.address}, {listing.city}</span>
                  </p>
                  <p className="mt-4 line-clamp-4 shrink-0 type-body leading-relaxed text-[var(--color-text-secondary)]">
                    {listing.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing.features.slice(0, 5).map((feature) => (
                      <span key={feature} className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 type-caption text-[var(--color-text-secondary)]">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    className="mt-4 type-label"
                  >
                    <ExternalLink size={15} />
                    Full Listing Details
                  </Button>
                </div>

                <div className="mt-5 relative min-h-[240px] flex-1 overflow-hidden rounded-[20px] bg-[var(--color-surface)]">
                  <DesktopListingMap listing={listing} />
                </div>
              </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-20 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
            <div />
            <div data-desktop-card-controls="true" className="relative flex items-center justify-center gap-2.5">
            {showDesktopTip && (
              <div className="absolute bottom-[calc(100%+0.9rem)] left-1/2 w-[360px] -translate-x-1/2 rounded-[24px] bg-white px-6 py-5 text-center shadow-[0_18px_44px_rgba(15,23,41,0.18)]">
                <p className="font-heading text-[1.25rem] font-semibold leading-tight text-[var(--color-text-primary)]">Choose with Pass or Save</p>
                <p className="mt-2 type-body leading-relaxed text-[var(--color-text-secondary)]">
                  Click Pass to skip this home, or Save to pick a collection. Scroll vertically anytime to browse the stack.
                </p>
                <Button onClick={dismissDesktopTip} size="md" className="mt-4 min-w-[112px] type-label">
                  Got it
                </Button>
                <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
              </div>
            )}
            <Button
              variant="elevated"
              shape="circle"
              size="control"
              onClick={() => navigateCard('previous')}
              disabled={activeIndex === 0}
              aria-label="Undo to previous card"
            >
              <Undo2 size={17} />
            </Button>
            <button
              onClick={passListing}
              className={cn(
                ACTION_BUTTON_CLASS,
                'h-[4.1rem] min-w-[168px] gap-2.5 !px-9 !text-[18px] !leading-none font-semibold text-[var(--color-text-secondary)] xl:h-[4.35rem] xl:min-w-[180px] xl:gap-3 xl:!px-10 xl:!text-[19px] 2xl:h-[4.6rem] 2xl:min-w-[192px] 2xl:!px-12 2xl:!text-[20px]',
                activeSwipePreview === 'pass' && 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
              )}
            >
              <X size={24} strokeWidth={2.4} />
              <span className={DESKTOP_ACTION_BUTTON_LABEL_CLASS}>Pass</span>
            </button>
            <button
              onClick={toggleHeartSave}
              className={cn(
                ACTION_BUTTON_CLASS,
                'relative h-[4.1rem] min-w-[168px] gap-2.5 !px-9 !text-[18px] !leading-none font-semibold text-[var(--color-text-primary)] xl:h-[4.35rem] xl:min-w-[180px] xl:gap-3 xl:!px-10 xl:!text-[19px] 2xl:h-[4.6rem] 2xl:min-w-[192px] 2xl:!px-12 2xl:!text-[20px]',
                activeSwipePreview === 'save' && 'bg-[var(--color-accent-subtle,#fdf2f8)] text-[var(--color-accent)]'
              )}
            >
              <HeartDelight activeKey={heartDelightKey}>
                <Heart
                  size={24}
                  strokeWidth={2.4}
                  className={cn((liked || activeSwipePreview === 'save') ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-accent)]')}
                />
              </HeartDelight>
              <span className={DESKTOP_ACTION_BUTTON_LABEL_CLASS}>Save</span>
            </button>
            <Button
              variant="elevated"
              shape="circle"
              size="control"
              onClick={(event) => {
                dismissOnboarding();
                setDesktopSortAnchorRect(event.currentTarget.getBoundingClientRect());
              }}
              aria-label="Sort cards"
              active={isSortOpen}
            >
              <ArrowDownWideNarrow size={17} />
            </Button>
            </div>
            <div className="flex min-w-0 justify-end">
              <AnimatePresence>
                {quickSavePrompt && (
                  <QuickSavePrompt
                    collectionName={quickSavePrompt.collectionName}
                    onChangeCollection={() => openChangeCollectionPicker(quickSavePrompt.listing)}
                    desktop
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnchoredPopover
          anchorRect={desktopSortAnchorRect}
          open={isSortOpen}
          onClose={() => setDesktopSortAnchorRect(null)}
          className="fixed z-[120]"
        >
          <DesktopSortMenu
            options={CARDS_MODE_SORT_OPTIONS}
            value={sortMode}
            onChange={(value) => {
              setSortMode(value);
              setDesktopImageIndex(0);
              setCurrentIndex(0);
              setDesktopSortAnchorRect(null);
            }}
          />
        </AnchoredPopover>

        <AnimatePresence>
          {savePickerListing && (
            <SaveToCollectionSheet
              listingId={savePickerListing.id}
              anchorRect={savePickerAnchorRect}
              placement="above"
              onClose={() => {
                setSavePickerListing(null);
                setSavePickerAnchorRect(null);
              }}
              onSaved={(collectionId) => {
                rememberCollection(collectionId);
                const savedListing = savePickerListing;
                setSavePickerListing(null);
                setSavePickerAnchorRect(null);
                setHeartDelightKey((key) => key + 1);
                if (savePickerMode === 'change') {
                  const collectionName =
                    collections.find((collection) => collection.id === collectionId)?.name ?? 'Collection';
                  if (savedListing) {
                    setQuickSavePrompt({ listing: savedListing, collectionName });
                  }
                  return;
                }
                setActiveSwipePreview('save');
                window.setTimeout(() => {
                  setActiveSwipePreview(null);
                  commitCardExit('save', savedListing);
                }, 520);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-white overscroll-none"
      initial={{ y: '100%', opacity: 1, scale: 1 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: '100%', opacity: 1, scale: 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ overscrollBehaviorX: 'none', overscrollBehaviorY: 'none', touchAction: 'pan-y' }}
    >
      <OverlayCloseButton
        onClick={() => {
          dismissOnboarding();
          onClose();
        }}
        label="Close cards view"
        className="absolute z-[70]"
        style={{ right: '1rem', top: 'calc(env(safe-area-inset-top, 0px) + 1.1rem)' }}
        variant="overlay"
      />
      {/* Card stack */}
      <div
        ref={stackRef}
        className="relative min-h-0 flex-1 overflow-visible px-2 pb-2 pt-2"
        style={{ touchAction: 'none', overscrollBehaviorX: 'none', overscrollBehaviorY: 'contain' }}
        onWheel={handleTrackWheel}
      >
        <div className="relative mx-auto h-full" style={{ width: cardWidth }}>
          {visibleListings.map((item, offset) => {
            const index = activeIndex + offset;
            return (
            <CardModeListingCard
              key={item.id}
              listing={item}
              width={cardWidth}
              active={offset === 0}
              stackIndex={offset}
              enterFrom={offset === 0 && enteringListingId === item.id ? 'left' : null}
              swipeExitAction={null}
              exitStartX={0}
              previewAction={offset === 0 ? activeSwipePreview : null}
              className="absolute left-0 top-0"
              style={{ height: '100%' }}
              onSwipe={(action, offsetX) => {
                if (action === 'save') {
                  quickSaveListing(item, offsetX, 0);
                  return;
                }
                commitCardExit(action, item, offsetX);
              }}
              onDragActivity={(dragging) => {
                activeDragRef.current = dragging;
              }}
              onSwipePreview={setActiveSwipePreview}
              onOpenDetail={() => {
                if (activeDragRef.current) return;
                dismissOnboarding();
                setCurrentIndex(index);
                setDrawerListing(item);
                setShowDetailDrawer(true);
              }}
              onOpenMap={() => {
                if (activeDragRef.current) return;
                dismissOnboarding();
                setCurrentIndex(index);
                setDrawerListing(item);
                setShowMapDrawer(true);
              }}
              onInteract={dismissOnboarding}
            />
            );
          })}
          {exitingCard && (
            <CardModeListingCard
              key={`exiting-${exitingCard.listing.id}-${exitingCard.token}`}
              listing={exitingCard.listing}
              width={cardWidth}
              active
              inert
              stackIndex={0}
              enterFrom={null}
              swipeExitAction={exitingCard.action}
              exitStartX={exitingCard.startX}
              previewAction={null}
              className="absolute left-0 top-0 z-[60]"
              style={{ height: '100%' }}
              onSwipe={() => undefined}
              onDragActivity={() => undefined}
              onSwipePreview={() => undefined}
              onOpenDetail={() => undefined}
              onOpenMap={() => undefined}
              onInteract={() => undefined}
            />
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="relative z-[80] flex flex-shrink-0 items-center justify-center gap-2.5 bg-transparent px-6 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <Button
          variant="elevated"
          shape="circle"
          size="control"
          onClick={() => navigateCard('previous')}
          disabled={activeIndex === 0}
          aria-label="Undo to previous card"
        >
          <Undo2 size={17} />
        </Button>

        <button
          onClick={passListing}
          className={cn(
            ACTION_BUTTON_CLASS,
            'text-[var(--color-text-secondary)]',
            activeSwipePreview === 'pass' && 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
          )}
        >
          <X size={18} strokeWidth={2.4} />
          <span>Pass</span>
        </button>

        <button
          onClick={toggleHeartSave}
          className={cn(
            ACTION_BUTTON_CLASS,
            'relative text-[var(--color-text-primary)]',
            activeSwipePreview === 'save' && 'bg-[var(--color-accent-subtle,#fdf2f8)] text-[var(--color-accent)]'
          )}
        >
          <HeartDelight activeKey={heartDelightKey}>
            <Heart
              size={18}
              strokeWidth={2.4}
              className={cn((liked || activeSwipePreview === 'save') ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-accent)]')}
            />
          </HeartDelight>
          <span>Save</span>
        </button>

        <Button
          variant="elevated"
          shape="circle"
          size="control"
          onClick={() => {
            dismissOnboarding();
            setShowSortDrawer(true);
          }}
          aria-label="Sort cards"
        >
          <ArrowDownWideNarrow size={17} strokeWidth={2} />
        </Button>
      </div>

      {/* Listing detail drawer */}
      <AnimatePresence>
        {quickSavePrompt && (
          <QuickSavePrompt
            collectionName={quickSavePrompt.collectionName}
            onChangeCollection={() => openChangeCollectionPicker(quickSavePrompt.listing)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {savePickerListing && (
          <SaveToCollectionSheet
            listingId={savePickerListing.id}
            anchorRect={savePickerAnchorRect}
            onClose={() => {
              setSavePickerListing(null);
              setSavePickerAnchorRect(null);
            }}
            onSaved={(collectionId) => {
              rememberCollection(collectionId);
              const savedListing = savePickerListing;
              setSavePickerListing(null);
              setSavePickerAnchorRect(null);
              setHeartDelightKey((key) => key + 1);
              if (savePickerMode === 'change') {
                const collectionName =
                  collections.find((collection) => collection.id === collectionId)?.name ?? 'Collection';
                if (savedListing) {
                  setQuickSavePrompt({ listing: savedListing, collectionName });
                }
                return;
              }
              setActiveSwipePreview('save');
              window.setTimeout(() => {
                setActiveSwipePreview(null);
                commitCardExit('save', savedListing);
              }, 520);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSortDrawer && (
          <SortOptionsDrawer
            title="Sort cards"
            open={showSortDrawer}
            value={sortMode}
            options={CARDS_MODE_SORT_OPTIONS}
            onClose={() => setShowSortDrawer(false)}
            onChange={(value) => {
              setSortMode(value);
              setDesktopImageIndex(0);
              setCurrentIndex(0);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <MobileDrawer
            onClose={dismissOnboarding}
            heightClassName="h-auto max-h-[58dvh]"
            contentClassName="px-6 pb-6 pt-0"
            showBackdrop
            showCloseButton={false}
            zIndex={90}
          >
            <div className="mx-auto flex max-w-[320px] flex-col items-center text-center">
              <div className="relative flex h-24 w-full items-center justify-center">
                <motion.div
                  className="absolute h-[4.5rem] w-[8.5rem] rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-control)]"
                  animate={{ x: [-18, 18, -18] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute h-[4.5rem] w-[8.5rem] rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] opacity-75" />
                <motion.div
                  className="absolute flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-3 py-1.5 shadow-[var(--shadow-control)]"
                  animate={{ y: [6, -6, 6], opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowLeftRight size={14} className="text-[var(--color-text-inverse)]" />
                  <span className="type-micro text-[var(--color-text-inverse)]">Swipe</span>
                </motion.div>
              </div>
              <h3 className="mt-1 type-subtitle text-[var(--color-text-primary)]">Welcome to card mode ✨</h3>
              <p className="mt-2 type-body text-[var(--color-text-secondary)]">
                Swipe left to pass, right to save, or use the buttons below the card.
              </p>
              <Button onClick={dismissOnboarding} size="md" className="mt-4 min-w-[132px] type-btn">
                Got it
              </Button>
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailDrawer && detailDrawerListing && (
          <MobileDrawer
            title={detailDrawerListing.address.split(',')[0]}
            onClose={() => setShowDetailDrawer(false)}
            heightClassName="max-h-[72dvh]"
            contentClassName="p-4"
            zIndex={90}
            footer={(
              <Button
                onClick={() => {
                  setShowDetailDrawer(false);
                  router.push(`/listings/${detailDrawerListing.id}`);
                }}
                fullWidth
                size="lg"
              >
                Full Listing Detail
              </Button>
            )}
          >
            <p className="type-title text-[var(--color-text-primary)]"><PriceText price={detailDrawerListing.price} /></p>
            <p className="mt-1 type-body text-[var(--color-text-secondary)]">
              {detailDrawerListing.beds}bd · {detailDrawerListing.baths}ba · {formatSqft(detailDrawerListing.sqft)} sqft
            </p>
            <p className="mt-1 flex items-center gap-1 type-caption text-[var(--color-text-tertiary)]">
              <MapPin size={11} />
              {detailDrawerListing.address}, {detailDrawerListing.city}
            </p>
            <div className="my-4 h-px bg-[var(--color-surface)]" />
            <p className="type-body leading-relaxed text-[var(--color-text-secondary)]">{detailDrawerListing.description}</p>
            <div className="my-4 h-px bg-[var(--color-surface)]" />
            <div className="flex flex-wrap gap-2">
              {detailDrawerListing.features.map((f) => (
                <span key={f} className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 type-caption text-[var(--color-text-secondary)]">{f}</span>
              ))}
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>

      {/* Mini-map drawer */}
      <AnimatePresence>
        {showMapDrawer && mapDrawerListing && (
          <MobileDrawer
            title={(
              <div className="pr-6 font-heading text-[1.02rem] font-medium leading-[1.35] text-[var(--color-text-secondary)]">
                {mapDrawerListing.address}
              </div>
            )}
            onClose={() => setShowMapDrawer(false)}
            heightClassName="h-[58dvh]"
            contentClassName="flex flex-1 flex-col px-4 pb-4 pt-0"
            zIndex={90}
          >
            {MAPBOX_TOKEN ? (
              <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[24px]">
                <MapGL
                  initialViewState={{
                    longitude: mapDrawerListing.coordinates.lng,
                    latitude: mapDrawerListing.coordinates.lat,
                    zoom: 13.2,
                  }}
                  mapStyle="mapbox://styles/mapbox/standard"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  attributionControl={false}
                  style={{ width: '100%', height: '100%' }}
                  config={{
                    basemap: {
                      theme: 'faded',
                      lightPreset: 'day',
                      show3dObjects: false,
                    },
                  }}
                >
                  <Marker
                    longitude={mapDrawerListing.coordinates.lng}
                    latitude={mapDrawerListing.coordinates.lat}
                    anchor="bottom"
                  >
                    <MapListingPin size={22} dotSize={6} className="drop-shadow-[0_4px_12px_rgba(15,23,41,0.18)]" />
                  </Marker>
                  <AttributionControl compact position="bottom-right" />
                </MapGL>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-[24px] bg-[var(--color-surface-hover)]">
                <div className="text-center p-6">
                  <MapPin size={36} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
                  <p className="type-label text-[var(--color-text-primary)]">{mapDrawerListing.neighborhood}</p>
                  <p className="mt-1 type-body text-[var(--color-text-tertiary)]">{mapDrawerListing.address}</p>
                  <p className="mt-1 type-caption text-[var(--color-text-tertiary)]">{mapDrawerListing.coordinates.lat.toFixed(4)}, {mapDrawerListing.coordinates.lng.toFixed(4)}</p>
                </div>
              </div>
            )}
          </MobileDrawer>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DesktopListingImage({
  src,
  alt,
  fallbackIndex = 0,
  eager = false,
}: {
  src: string;
  alt: string;
  fallbackIndex?: number;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const fallbackSrc = FALLBACK_LISTING_IMAGES[fallbackIndex % FALLBACK_LISTING_IMAGES.length];
  const imageSrc = failedSrc === src ? fallbackSrc : src;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes="(min-width: 1280px) 65vw, 58vw"
      className="object-cover"
      draggable={false}
      priority={eager}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function QuickSavePrompt({
  collectionName,
  desktop = false,
  onChangeCollection,
}: {
  collectionName: string;
  desktop?: boolean;
  onChangeCollection: () => void;
}) {
  return (
    <motion.div
      data-card-overlay-control="true"
      data-quick-save-prompt="true"
      className={cn(
        'z-[130] flex items-center justify-between gap-3 rounded-md border border-white/70 bg-white/58 shadow-[0_12px_34px_rgba(15,23,41,0.16)] backdrop-blur-2xl',
        desktop
          ? 'relative h-14 w-full max-w-[320px] py-3 pl-6 pr-3'
          : 'fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] h-11 w-[min(calc(100vw-7.25rem),292px)] -translate-x-1/2 py-1.5 pl-4 pr-1.5'
      )}
      initial={{ y: desktop ? 10 : -10, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: desktop ? 8 : -8, opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="min-w-0 truncate type-label text-[var(--color-text-primary)]">
        Saved to &quot;{collectionName}&quot;
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={onChangeCollection}
        className="h-8 shrink-0 px-3 type-label"
      >
        Change
      </Button>
    </motion.div>
  );
}

function DesktopListingMap({ listing }: { listing: Listing }) {
  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full min-h-[230px] items-center justify-center bg-[var(--color-surface-hover)] p-6">
        <div className="text-center">
          <MapPin size={34} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="type-label text-[var(--color-text-primary)]">{listing.neighborhood}</p>
          <p className="mt-1 type-body text-[var(--color-text-tertiary)]">{listing.address}</p>
          <p className="mt-1 type-caption text-[var(--color-text-tertiary)]">
            {listing.coordinates.lat.toFixed(4)}, {listing.coordinates.lng.toFixed(4)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapGL
      initialViewState={{
        longitude: listing.coordinates.lng,
        latitude: listing.coordinates.lat,
        zoom: 13.8,
      }}
      mapStyle="mapbox://styles/mapbox/standard"
      mapboxAccessToken={MAPBOX_TOKEN}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
      config={{
        basemap: {
          theme: 'faded',
          lightPreset: 'day',
          show3dObjects: false,
        },
      }}
    >
      <Marker
        longitude={listing.coordinates.lng}
        latitude={listing.coordinates.lat}
        anchor="bottom"
      >
        <MapListingPin size={24} dotSize={7} className="drop-shadow-[0_4px_12px_rgba(15,23,41,0.2)]" />
      </Marker>
      <AttributionControl compact position="bottom-right" />
    </MapGL>
  );
}

function DesktopSwipeStamp({ action }: { action: CardSwipeAction }) {
  const isSave = action === 'save';
  return (
    <div className="pointer-events-none absolute left-1/2 top-[42%] z-30 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        aria-hidden="true"
        className={cn(
          'rounded-2xl border-2 px-7 py-3 font-heading text-[1.65rem] font-semibold tracking-[0.1em] shadow-[0_14px_34px_rgba(15,23,41,0.18)] backdrop-blur-sm',
          isSave
            ? 'rotate-6 border-[var(--color-accent)] bg-white/78 text-[var(--color-accent)]'
            : '-rotate-6 border-[#6B7280] bg-white/78 text-[#4B5563]'
        )}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
      >
        {isSave ? 'SAVE' : 'PASS'}
      </motion.div>
    </div>
  );
}

function getDesktopThumbnailImages(images: string[]) {
  return images.map((src, index) => ({ src, index }));
}
