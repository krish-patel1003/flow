import { useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useStore } from './store';

const TOUR_SEEN_KEY = 'msmk_tour_v2_seen';

const steps = [
  {
    target: '.toolbar',
    title: 'Components Library',
    content: 'Browse and drag components from here to build your pipeline.',
    disableBeacon: true,
  },
  {
    target: '.library-search',
    title: 'Search Components',
    content: 'Type to quickly find nodes as your library grows.',
  },
  {
    target: '.canvas-pane',
    title: 'Canvas',
    content: 'Drop nodes here, then connect handles to define data flow.',
  },
  {
    target: '.right-pane-tabs',
    title: 'Inspect and Console',
    content: 'Use tabs here like browser devtools: configure in Inspect, monitor in Console.',
  },
  {
    target: '.inspector-panel',
    title: 'Node Settings',
    content: 'Select any node and edit its settings in this panel.',
  },
  {
    target: '[data-tour="submit-pipeline"]',
    title: 'Run Pipeline',
    content: 'Click here to validate and execute your pipeline.',
  },
  {
    target: '.tour-replay-button',
    title: 'Replay Tour',
    content: 'You can replay this tour anytime from here.',
  },
];

export const OnboardingTour = () => {
  const { tourRunning, setTourRunning, setTourSeen } = useStore((state) => ({
    tourRunning: state.tourRunning,
    setTourRunning: state.setTourRunning,
    setTourSeen: state.setTourSeen,
  }));

  useEffect(() => {
    const seen = window.localStorage.getItem(TOUR_SEEN_KEY) === 'true';
    if (!seen) {
      setTourSeen(false);
      setTourRunning(true);
    } else {
      setTourSeen(true);
    }
  }, [setTourRunning, setTourSeen]);

  const onJoyrideCallback = (data) => {
    const finished = [STATUS.FINISHED, STATUS.SKIPPED].includes(data.status);
    if (finished) {
      window.localStorage.setItem(TOUR_SEEN_KEY, 'true');
      setTourSeen(true);
      setTourRunning(false);
    }
  };

  return (
    <Joyride
      run={tourRunning}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      disableOverlay
      spotlightClicks
      disableOverlayClose
      callback={onJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#0d5a8f',
          textColor: '#1d3951',
          zIndex: 1000,
        },
      }}
    />
  );
};
