import type { DashboardData } from '../types';

// Demo seed data so the dashboard is visible immediately, before Firebase is
// wired in. Images use picsum.photos (stable seeds) and avatars use pravatar —
// both free and reliable. Replace with real assets via the /admin config site.

export const demoData: DashboardData = {
  settings: {
    brandName: 'RMIT Marketing',
    rotationSeconds: 12,
    birthdayWindowDays: 30,
    showSeconds: false,
    tickerMessages: [
      'Welcome to the RMIT Marketing live wall',
      'Open Day registrations now live',
      'Submit your campaign assets via the config portal',
    ],
  },
  campaigns: [
    {
      id: 'c-openday',
      title: 'Open Day 2026',
      tagline: 'Discover your future at RMIT',
      status: 'upcoming',
      startDate: '2026-08-09',
      endDate: '2026-08-09',
      images: [
        'https://picsum.photos/seed/rmit-openday/1200/800',
        'https://picsum.photos/seed/rmit-student/800/1200',
      ],
      youtubeUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
      stats: [
        { id: 's1', label: 'Registrations', value: '4,820', delta: '+18%', trend: 'up', platform: 'Web' },
        { id: 's2', label: 'Reel views', value: '212K', delta: '+34%', trend: 'up', platform: 'Instagram' },
      ],
      tags: ['recruitment', 'event'],
    },
    {
      id: 'c-research',
      title: 'Research Spotlight',
      tagline: 'Ideas that shape industry',
      status: 'ongoing',
      startDate: '2026-05-01',
      endDate: '2026-07-31',
      images: [
        'https://picsum.photos/seed/rmit-research/1200/800',
        'https://picsum.photos/seed/rmit-lab/800/1200',
        'https://picsum.photos/seed/rmit-campus/1200/800',
      ],
      stats: [
        { id: 's3', label: 'Article reads', value: '38K', delta: '+12%', trend: 'up', platform: 'LinkedIn' },
        { id: 's4', label: 'New followers', value: '6.1K', delta: '+9%', trend: 'up', platform: 'LinkedIn' },
      ],
      tags: ['brand', 'research'],
    },
    {
      id: 'c-scholar',
      title: 'Scholarships Drive',
      tagline: 'Support that goes further',
      status: 'ongoing',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      images: [
        'https://picsum.photos/seed/rmit-scholar/1200/800',
        'https://picsum.photos/seed/rmit-grad/800/1200',
      ],
      stats: [
        { id: 's5', label: 'Applications', value: '1,304', delta: '+22%', trend: 'up', platform: 'Web' },
        { id: 's6', label: 'TikTok views', value: '540K', delta: '+61%', trend: 'up', platform: 'TikTok' },
      ],
      tags: ['recruitment'],
    },
    {
      id: 'c-alumni',
      title: 'Alumni Connect',
      tagline: 'Once a Redback, always a Redback',
      status: 'upcoming',
      startDate: '2026-09-15',
      endDate: '2026-09-15',
      images: [
        'https://picsum.photos/seed/rmit-alumni/1200/800',
        'https://picsum.photos/seed/rmit-network/800/1200',
      ],
      stats: [
        { id: 's7', label: 'RSVPs', value: '912', delta: '+7%', trend: 'up', platform: 'Web' },
        { id: 's8', label: 'Engagement', value: '4.8%', delta: '+0.6pt', trend: 'up', platform: 'Instagram' },
      ],
      tags: ['event', 'community'],
    },
  ],
  birthdays: [
    { id: 'b1', name: 'Linh Nguyen', date: '06-19', photoUrl: 'https://i.pravatar.cc/200?img=5', team: 'Social' },
    { id: 'b2', name: 'Minh Tran', date: '06-25', photoUrl: 'https://i.pravatar.cc/200?img=12', team: 'Content' },
    { id: 'b3', name: 'Sarah Lee', date: '07-02', photoUrl: 'https://i.pravatar.cc/200?img=32', team: 'Design' },
    { id: 'b4', name: 'David Pham', date: '07-10', photoUrl: 'https://i.pravatar.cc/200?img=15', team: 'Brand' },
  ],
  pictures: [
    'https://picsum.photos/seed/rmit-week1/1200/900',
    'https://picsum.photos/seed/rmit-week2/1200/900',
    'https://picsum.photos/seed/rmit-week3/1200/900',
    'https://picsum.photos/seed/rmit-week4/1200/900',
    'https://picsum.photos/seed/rmit-week5/1200/900',
  ],
};
