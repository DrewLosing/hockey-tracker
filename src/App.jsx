import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Flame, Plus, X, Target, Users, Share2, Sparkles } from 'lucide-react';
import { supabase } from './supabaseClient';

const PALETTE = {
  navy: '#0B1F33',
  navyDark: '#071522',
  panel: '#12253A',
  panelLine: '#233C56',
  ice: '#EAF2F6',
  iceDim: '#93A9BA',
  red: '#C8283F',
  gold: '#D3A625',
  steel: '#5B8DBE',
  teal: '#2E9C8F',
  purple: '#8A6FC0',
};

const PLAYER_COLORS = [PALETTE.red, PALETTE.steel, PALETTE.gold, PALETTE.teal, PALETTE.purple];

// Shared "every 50" milestone ladder used for the goals/assists/games club badges.
const MILESTONES_50 = Array.from({ length: 30 }, (_, i) => (i + 1) * 50);
const POINTS_MILESTONES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000];

function nextMilestone(value, list) {
  const next = list.find((m) => m > value);
  return next ? { target: next, remaining: next - value } : null;
}

const GOAL_METRICS = [
  { key: 'points', label: 'очков' },
  { key: 'goals', label: 'голов' },
  { key: 'assists', label: 'передач' },
  { key: 'games', label: 'игр' },
];

function metricValue(playerStats, metric) {
  if (!playerStats) return 0;
  if (metric === 'games') return playerStats.gp;
  return playerStats[metric] || 0;
}

function calcAge(birthDateIso) {
  if (!birthDateIso) return null;
  const bd = new Date(`${birthDateIso}T00:00:00`);
  if (Number.isNaN(bd.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const hadBirthdayThisYear = today.getMonth() > bd.getMonth()
    || (today.getMonth() === bd.getMonth() && today.getDate() >= bd.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

function nearestMilestone(p) {
  const candidates = [
    { label: 'очков', ...nextMilestone(p.points, POINTS_MILESTONES) },
    { label: 'голов', ...nextMilestone(p.goals, MILESTONES_50) },
    { label: 'передач', ...nextMilestone(p.assists, MILESTONES_50) },
    { label: 'игр', ...nextMilestone(p.gp, MILESTONES_50) },
  ].filter((c) => c.target);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.remaining - b.remaining);
  return candidates[0];
}

function computeTrend(p) {
  if (!p || !p.entries || p.entries.length < 5 || p.ppg === 0) return null;
  const last = p.entries.slice(-5);
  const lastAvg = last.reduce((s, e) => s + e.points, 0) / last.length;
  if (lastAvg > p.ppg * 1.15) return 'up';
  if (lastAvg < p.ppg * 0.85) return 'down';
  return null;
}

const DEFAULT_PLAYERS = ['Андрей', 'Валёк', 'Санёк', 'Санёк М.'];

const SEED_CATEGORIES = [{"id": "training", "name": "Игровая тренировка", "countsStats": true, "hasTeams": false, "hasTournament": false}, {"id": "training_no_stats", "name": "Тренировка", "countsStats": false, "hasTeams": false, "hasTournament": false}, {"id": "friendly", "name": "Товарищеский матч", "countsStats": true, "hasTeams": true, "hasTournament": false}, {"id": "tournament_match", "name": "Турнирный матч", "countsStats": true, "hasTeams": true, "hasTournament": true}];

const SEED_TOURNAMENTS = [{"id": "t1", "name": "30+"}, {"id": "t2", "name": "35+"}, {"id": "t3", "name": "50+"}, {"id": "t4", "name": "АХЛ"}, {"id": "t5", "name": "НХЛ"}, {"id": "t6", "name": "Турнир закрытия сезона"}, {"id": "t7", "name": "УГО"}, {"id": "t8", "name": "турнир на приз главы Октябрьского района"}, {"id": "t9", "name": "турнир по хоккею г. Владивосток"}];

const SEED_TEAMS = [{"id": "tm1", "name": "Акулы ВМТП"}, {"id": "tm2", "name": "Аларм"}, {"id": "tm3", "name": "Армия"}, {"id": "tm4", "name": "Белые тигры"}, {"id": "tm5", "name": "Вектор"}, {"id": "tm6", "name": "Ветераны"}, {"id": "tm7", "name": "Витязь"}, {"id": "tm8", "name": "Водострой"}, {"id": "tm9", "name": "Восточник"}, {"id": "tm10", "name": "ДВЖД"}, {"id": "tm11", "name": "ДетДом"}, {"id": "tm12", "name": "Доброфлот"}, {"id": "tm13", "name": "Змеинка"}, {"id": "tm14", "name": "Исток"}, {"id": "tm15", "name": "Каскад"}, {"id": "tm16", "name": "Колос"}, {"id": "tm17", "name": "Лавина"}, {"id": "tm18", "name": "Легион"}, {"id": "tm19", "name": "Ледяный волки"}, {"id": "tm20", "name": "Ледяный титаны"}, {"id": "tm21", "name": "Локомотив"}, {"id": "tm22", "name": "МЧС"}, {"id": "tm23", "name": "Мотор"}, {"id": "tm24", "name": "Покровка"}, {"id": "tm25", "name": "Портер"}, {"id": "tm26", "name": "Приморье"}, {"id": "tm27", "name": "Росмет"}, {"id": "tm28", "name": "Русский Остров"}, {"id": "tm29", "name": "Спартак"}, {"id": "tm30", "name": "Спортландия"}, {"id": "tm31", "name": "Супротек"}, {"id": "tm32", "name": "Тавричанка"}, {"id": "tm33", "name": "УСВУ"}, {"id": "tm34", "name": "Факел"}, {"id": "tm35", "name": "Фанзавод"}, {"id": "tm36", "name": "Фриведтранс"}, {"id": "tm37", "name": "Шахтёр"}, {"id": "tm38", "name": "Юность"}, {"id": "tm39", "name": "Ярость"}];

const SEED_MATCHES = [{"id": "m1", "date": "2026-09-05", "label": "Игровая тренировка 05.09.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m2", "date": "2026-09-11", "label": "Игровая тренировка 11.09.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m3", "date": "2025-09-06", "label": "Игровая тренировка 06.09.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m4", "date": "2025-09-13", "label": "Игровая тренировка 13.09.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m5", "date": "2025-09-14", "label": "Игровая тренировка 14.09.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m6", "date": "2025-09-21", "label": "Игровая тренировка 21.09.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m7", "date": "2025-09-28", "label": "Игровая тренировка 28.09.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m8", "date": "2025-10-03", "label": "Игровая тренировка 03.10.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m9", "date": "2025-10-04", "label": "Игровая тренировка 04.10.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m10", "date": "2025-10-11", "label": "Игровая тренировка 11.10.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m11", "date": "2025-10-12", "label": "Игровая тренировка 12.10.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m12", "date": "2025-10-17", "label": "Игровая тренировка 17.10.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m13", "date": "2025-10-18", "label": "Игровая тренировка 18.10.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m14", "date": "2025-10-25", "label": "Игровая тренировка 25.10.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m15", "date": "2025-11-01", "label": "Игровая тренировка 01.11.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m16", "date": "2025-11-04", "label": "Игровая тренировка 04.11.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m17", "date": "2025-11-08", "label": "АХЛ. Легион - Локомотив 6:3", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm21", "scoreOwn": 6, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m18", "date": "2025-11-08", "label": "Игровая тренировка 08.11.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m19", "date": "2025-11-15", "label": "АХЛ. Легион - Мотор 4:5 б", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm23", "scoreOwn": 4, "scoreOpp": 5, "finish": "Буллиты", "stage": null}, {"id": "m20", "date": "2025-11-15", "label": "Игровая тренировка 15.11.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m21", "date": "2025-11-16", "label": "УГО. Легион - Аларм 5:4 б", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm2", "scoreOwn": 5, "scoreOpp": 4, "finish": "Буллиты", "stage": null}, {"id": "m22", "date": "2025-11-23", "label": "Игровая тренировка 23.11.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m23", "date": "2025-11-25", "label": "товарняк. Армия - МЧС 9:11", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm3", "opponentTeamId": "tm22", "scoreOwn": 9, "scoreOpp": 11, "finish": null, "stage": null}, {"id": "m24", "date": "2025-11-29", "label": "АХЛ. Легион - Доброфлот 1:3", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm12", "scoreOwn": 1, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m25", "date": "2025-11-30", "label": "УГО. Легион - Супротек 6:7 б", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": 6, "scoreOpp": 7, "finish": "Буллиты", "stage": null}, {"id": "m26", "date": "2025-12-05", "label": "Игровая тренировка 05.12.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m27", "date": "2025-12-06", "label": "Игровая тренировка 06.12.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m28", "date": "2025-12-12", "label": "АХЛ. Легион - Спортландия 4:1", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm30", "scoreOwn": 4, "scoreOpp": 1, "finish": null, "stage": null}, {"id": "m29", "date": "2025-12-13", "label": "Игровая тренировка 13.12.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m30", "date": "2025-12-20", "label": "Игровая тренировка 20.12.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m31", "date": "2025-12-25", "label": "товарняк. Армия - МЧС 6:7", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm3", "opponentTeamId": "tm22", "scoreOwn": 6, "scoreOpp": 7, "finish": null, "stage": null}, {"id": "m32", "date": "2025-12-27", "label": "Игровая тренировка 27.12.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m33", "date": "2025-12-28", "label": "турнир на приз главы Октябрьского Района. Легион - Тавричанка 7:6 б", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm32", "scoreOwn": 7, "scoreOpp": 6, "finish": "Буллиты", "stage": null}, {"id": "m34", "date": "2025-12-28", "label": "турнир на приз главы Октябрьского Района. Легион - Шахтёр 2:12", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": 2, "scoreOpp": 12, "finish": null, "stage": null}, {"id": "m35", "date": "2026-01-09", "label": "турнир на приз главы Октябрьского Района. Легион - Шахтёр 0:5", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": 0, "scoreOpp": 5, "finish": null, "stage": null}, {"id": "m36", "date": "2026-01-09", "label": "турнир на приз главы Октябрьского Района. Легион - Тавричанка 8:4", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm32", "scoreOwn": 8, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m37", "date": "2026-01-10", "label": "Игровая тренировка 10.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m38", "date": "2026-01-16", "label": "Игровая тренировка 16.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m39", "date": "2026-01-17", "label": "Игровая тренировка 17.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m40", "date": "2026-01-18", "label": "Игровая тренировка 18.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m41", "date": "2026-01-22", "label": "Игровая тренировка 22.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m42", "date": "2026-01-23", "label": "Игровая тренировка 23.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m43", "date": "2026-01-24", "label": "Игровая тренировка 24.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m44", "date": "2026-01-27", "label": "АХЛ. Легион - Локомотив 3:4 б", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm21", "scoreOwn": 3, "scoreOpp": 4, "finish": "Буллиты", "stage": null}, {"id": "m45", "date": "2026-01-30", "label": "Игровая тренировка 30.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m46", "date": "2026-01-31", "label": "Игровая тренировка 31.01.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m47", "date": "2026-02-06", "label": "Игровая тренировка 06.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m48", "date": "2026-02-07", "label": "Игровая тренировка 07.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m49", "date": "2026-02-08", "label": "НХЛ. Восточник - Портер 3:13", "categoryId": "tournament_match", "tournamentId": "t5", "ownTeamId": "tm9", "opponentTeamId": "tm25", "scoreOwn": 3, "scoreOpp": 13, "finish": null, "stage": null}, {"id": "m50", "date": "2026-02-13", "label": "Игровая тренировка 13.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m51", "date": "2026-02-18", "label": "Игровая тренировка 18.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m52", "date": "2026-02-19", "label": "Игровая тренировка 19.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m53", "date": "2026-02-20", "label": "Игровая тренировка 20.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m54", "date": "2026-02-27", "label": "Игровая тренировка 27.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m55", "date": "2026-02-28", "label": "Игровая тренировка 28.02.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m56", "date": "2026-03-06", "label": "Игровая тренировка 06.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m57", "date": "2026-03-07", "label": "Игровая тренировка 07.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m58", "date": "2026-03-09", "label": "Игровая тренировка 09.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m59", "date": "2026-03-14", "label": "Игровая тренировка 14.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m60", "date": "2026-03-21", "label": "Игровая тренировка 21.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m61", "date": "2026-03-22", "label": "Игровая тренировка 22.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m62", "date": "2026-03-28", "label": "Игровая тренировка 28.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m63", "date": "2026-03-28", "label": "товарняк. Армия - Белые тигры 2:4", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm3", "opponentTeamId": "tm4", "scoreOwn": 2, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m64", "date": "2026-03-30", "label": "АХЛ. Легион - Росмет 3:4", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm27", "scoreOwn": 3, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m65", "date": "2026-04-06", "label": "Игровая тренировка 06.04.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m66", "date": "2026-04-11", "label": "Игровая тренировка 11.04.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m67", "date": "2026-04-17", "label": "Игровая тренировка 17.04.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m68", "date": "2026-04-25", "label": "Игровая тренировка 25.04.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m69", "date": "2026-05-02", "label": "Турнир 30+. Армия - Аларм 4:3", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm3", "opponentTeamId": "tm2", "scoreOwn": 4, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m70", "date": "2026-05-02", "label": "Турнир 30+. Армия - Липовцы 2:4", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm3", "opponentTeamId": "tm37", "scoreOwn": 2, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m71", "date": "2026-05-02", "label": "Игровая тренировка 02.05.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m72", "date": "2026-05-03", "label": "Турнир 30+. Финал. Армия - Росмет 3:7", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm3", "opponentTeamId": "tm27", "scoreOwn": 3, "scoreOpp": 7, "finish": null, "stage": "Финал"}, {"id": "m73", "date": "2026-05-07", "label": "Игровая тренировка 07.05.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m74", "date": "2026-05-17", "label": "Игровая тренировка 17.05.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m75", "date": "2026-05-23", "label": "Турнир закрытия сезона. Армия - Вектор 8:4", "categoryId": "tournament_match", "tournamentId": "t6", "ownTeamId": "tm3", "opponentTeamId": "tm5", "scoreOwn": 8, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m76", "date": "2026-05-23", "label": "Турнир закрытия сезона. Армия - Фриведтранс 4:5", "categoryId": "tournament_match", "tournamentId": "t6", "ownTeamId": "tm3", "opponentTeamId": "tm36", "scoreOwn": 4, "scoreOpp": 5, "finish": null, "stage": null}, {"id": "m77", "date": "2026-05-23", "label": "Игровая тренировка 23.05.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m78", "date": "2026-05-23", "label": "Турнир закрытия сезона. Армия - Аларм 4:8", "categoryId": "tournament_match", "tournamentId": "t6", "ownTeamId": "tm3", "opponentTeamId": "tm2", "scoreOwn": 4, "scoreOpp": 8, "finish": null, "stage": null}, {"id": "m79", "date": "2026-05-23", "label": "Турнир закрытия сезона. Финал. Армия - Росмет 4:8", "categoryId": "tournament_match", "tournamentId": "t6", "ownTeamId": "tm3", "opponentTeamId": "tm27", "scoreOwn": 4, "scoreOpp": 8, "finish": null, "stage": "Финал"}, {"id": "m80", "date": "2024-09-14", "label": "Игровая тренировка 14.09.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m81", "date": "2024-09-18", "label": "Игровая тренировка 18.09.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m82", "date": "2024-09-21", "label": "Товарняк. Легион - Акулы 1:9", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm1", "scoreOwn": 1, "scoreOpp": 9, "finish": null, "stage": null}, {"id": "m83", "date": "2024-09-22", "label": "Игровая тренировка 22.09.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m84", "date": "2024-09-25", "label": "Игровая тренировка 25.09.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m85", "date": "2024-09-27", "label": "Игровая тренировка 27.09.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m86", "date": "2024-09-28", "label": "Игровая тренировка 28.09.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m87", "date": "2024-10-04", "label": "Игровая тренировка 04.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m88", "date": "2024-10-05", "label": "Игровая тренировка 05.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m89", "date": "2024-10-11", "label": "Игровая тренировка 11.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m90", "date": "2024-10-12", "label": "Игровая тренировка 12.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m91", "date": "2024-10-13", "label": "Игровая тренировка 13.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m92", "date": "2024-10-16", "label": "Игровая тренировка 16.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m93", "date": "2024-10-18", "label": "Игровая тренировка 18.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m94", "date": "2024-10-19", "label": "Игровая тренировка 19.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m95", "date": "2024-10-21", "label": "Игровая тренировка 21.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m96", "date": "2024-10-26", "label": "АХЛ. Легион - Супротек 1:9", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": 1, "scoreOpp": 9, "finish": null, "stage": null}, {"id": "m97", "date": "2024-10-26", "label": "Игровая тренировка 26.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m98", "date": "2024-10-30", "label": "АХЛ. Легион - Росмет 3:4", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm27", "scoreOwn": 3, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m99", "date": "2024-11-01", "label": "Игровая тренировка 01.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m100", "date": "2024-11-02", "label": "Игровая тренировка 02.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m101", "date": "2024-11-09", "label": "Игровая тренировка 09.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m102", "date": "2024-11-16", "label": "Игровая тренировка 16.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m103", "date": "2024-11-17", "label": "АХЛ. Легион - Акулы ВМТП 3:4", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm1", "scoreOwn": 3, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m104", "date": "2024-11-23", "label": "АХЛ. Легион - Ледяный волки 8:6", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm19", "scoreOwn": 8, "scoreOpp": 6, "finish": null, "stage": null}, {"id": "m105", "date": "2024-11-27", "label": "Игровая тренировка 27.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m106", "date": "2024-11-30", "label": "Игровая тренировка 30.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m107", "date": "2024-12-01", "label": "АХЛ. Легион - Ледяный титаны 7:6", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm20", "scoreOwn": 7, "scoreOpp": 6, "finish": null, "stage": null}, {"id": "m108", "date": "2024-12-13", "label": "Игровая тренировка 13.12.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m109", "date": "2024-12-14", "label": "Игровая тренировка 14.12.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m110", "date": "2024-12-18", "label": "Игровая тренировка 18.12.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m111", "date": "2024-12-20", "label": "Игровая тренировка 20.12.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m112", "date": "2024-12-21", "label": "Игровая тренировка 21.12.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m113", "date": "2024-12-28", "label": "Игровая тренировка 28.12.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m114", "date": "2025-01-11", "label": "Игровая тренировка 11.01.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m115", "date": "2025-01-17", "label": "Игровая тренировка 17.01.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m116", "date": "2025-01-18", "label": "Игровая тренировка 18.01.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m117", "date": "2025-01-24", "label": "Игровая тренировка 24.01.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m118", "date": "2025-01-25", "label": "Игровая тренировка 25.01.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m119", "date": "2025-01-26", "label": "Игровая тренировка 26.01.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m120", "date": "2025-01-29", "label": "Игровая тренировка 29.01.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m121", "date": "2025-02-01", "label": "Игровая тренировка 01.02.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m122", "date": "2025-02-07", "label": "Игровая тренировка 07.02.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m123", "date": "2025-02-08", "label": "АХЛ. Легион - Мотор 4:1", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm23", "scoreOwn": 4, "scoreOpp": 1, "finish": null, "stage": null}, {"id": "m124", "date": "2025-02-08", "label": "Игровая тренировка 08.02.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m125", "date": "2025-02-12", "label": "Игровая тренировка 12.02.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m126", "date": "2025-02-14", "label": "Игровая тренировка 14.02.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m127", "date": "2025-02-15", "label": "турнир 35+. Легион - Ветераны 2:7", "categoryId": "tournament_match", "tournamentId": "t2", "ownTeamId": "tm18", "opponentTeamId": "tm6", "scoreOwn": 2, "scoreOpp": 7, "finish": null, "stage": null}, {"id": "m128", "date": "2025-02-15", "label": "турнир 35+.  Легион - Вектор 4:3", "categoryId": "tournament_match", "tournamentId": "t2", "ownTeamId": "tm18", "opponentTeamId": "tm5", "scoreOwn": 4, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m129", "date": "2025-02-16", "label": "турнир 35+. Легион - Каскад 0:4", "categoryId": "tournament_match", "tournamentId": "t2", "ownTeamId": "tm18", "opponentTeamId": "tm15", "scoreOwn": 0, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m130", "date": "2025-03-01", "label": "АХЛ. Легион - Росмет 5:3", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm27", "scoreOwn": 5, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m131", "date": "2025-03-02", "label": "УГО. Легион - Ветераны 0:4", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm6", "scoreOwn": 0, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m132", "date": "2025-03-12", "label": "Игровая тренировка 12.03.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m133", "date": "2025-03-13", "label": "товарняк. ДВЖД 3:6", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm10", "scoreOwn": 3, "scoreOpp": 6, "finish": null, "stage": null}, {"id": "m134", "date": "2025-03-15", "label": "Игровая тренировка 15.03.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m135", "date": "2025-03-16", "label": "УГО. Легион - Водострой 5:4", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm8", "scoreOwn": 5, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m136", "date": "2025-03-22", "label": "Игровая тренировка 22.03.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m137", "date": "2025-03-29", "label": "Игровая тренировка 29.03.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m138", "date": "2025-04-05", "label": "Игровая тренировка 05.04.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m139", "date": "2025-04-06", "label": "УГО. Легион - Вектор 4:3", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm5", "scoreOwn": 4, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m140", "date": "2025-04-19", "label": "Игровая тренировка 19.04.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m141", "date": "2025-04-26", "label": "Игровая тренировка 26.04.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m142", "date": "2025-05-03", "label": "Игровая тренировка 03.05.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m143", "date": "2025-05-04", "label": "УГО. Легион - Каскад 5:1", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm15", "scoreOwn": 5, "scoreOpp": 1, "finish": null, "stage": null}, {"id": "m144", "date": "2025-05-08", "label": "УГО. Легион - Шахтер 6:3", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": 6, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m145", "date": "2025-05-10", "label": "Игровая тренировка 10.05.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m146", "date": "2025-05-17", "label": "Игровая тренировка 17.05.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m147", "date": "2025-05-24", "label": "Турнир закрытия сезона 2024-25. Вектор - Аларм 4:3", "categoryId": "tournament_match", "tournamentId": "t6", "ownTeamId": "tm5", "opponentTeamId": "tm2", "scoreOwn": 4, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m148", "date": "2025-05-24", "label": "Турнир закрытия сезона 2024-25. Вектор - Приморье 5:6", "categoryId": "tournament_match", "tournamentId": "t6", "ownTeamId": "tm5", "opponentTeamId": "tm26", "scoreOwn": 5, "scoreOpp": 6, "finish": null, "stage": null}, {"id": "m149", "date": "2025-05-24", "label": "Игровая тренировка 24.05.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m150", "date": "2025-05-25", "label": "Турнир закрытия сезона 2024-25. Финал. Вектор - Росмет 6:5", "categoryId": "tournament_match", "tournamentId": "t6", "ownTeamId": "tm5", "opponentTeamId": "tm27", "scoreOwn": 6, "scoreOpp": 5, "finish": null, "stage": "Финал"}, {"id": "m151", "date": "2025-05-27", "label": "Игровая тренировка 27.05.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m152", "date": "2025-05-29", "label": "Игровая тренировка 29.05.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m153", "date": "2023-09-30", "label": "Игровая тренировка 30.09.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m154", "date": "2023-10-07", "label": "Игровая тренировка 07.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m155", "date": "2023-10-08", "label": "Игровая тренировка 08.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m156", "date": "2023-10-09", "label": "Игровая тренировка 09.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m157", "date": "2023-10-14", "label": "Игровая тренировка 14.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m158", "date": "2023-10-28", "label": "Игровая тренировка 28.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m159", "date": "2023-10-31", "label": "Игровая тренировка 31.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m160", "date": "2023-11-04", "label": "Игровая тренировка 04.11.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m161", "date": "2023-11-05", "label": "товарняк .СУПРОТЕК", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m162", "date": "2023-11-07", "label": "Игровая тренировка 07.11.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m163", "date": "2023-11-11", "label": "Игровая тренировка 11.11.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m164", "date": "2023-11-12", "label": "товарняк. СУПРОТЕК", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m165", "date": "2023-11-14", "label": "товарняк. ВОДОСТРОЙ", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m166", "date": "2023-11-25", "label": "Игровая тренировка 25.11.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m167", "date": "2023-12-02", "label": "Игровая тренировка 02.12.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m168", "date": "2023-12-03", "label": "УГО. Шахтер 0:8", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": 0, "scoreOpp": 8, "finish": null, "stage": null}, {"id": "m169", "date": "2023-12-09", "label": "Игровая тренировка 09.12.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m170", "date": "2023-12-10", "label": "Игровая тренировка 10.12.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m171", "date": "2023-12-13", "label": "товаряк. Ветераны", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm6", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m172", "date": "2023-12-16", "label": "Игровая тренировка 16.12.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m173", "date": "2023-12-17", "label": "УГО. Витязь 2:13", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm7", "scoreOwn": 2, "scoreOpp": 13, "finish": null, "stage": null}, {"id": "m174", "date": "2023-12-23", "label": "Игровая тренировка 23.12.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m175", "date": "2023-12-30", "label": "Игровая тренировка 30.12.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m176", "date": "2024-01-13", "label": "Игровая тренировка 13.01.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m177", "date": "2024-01-27", "label": "турнир по хоккею г. Владивосток. Полуфинал. Факел - Змеинка 1:0", "categoryId": "tournament_match", "tournamentId": "t9", "ownTeamId": "tm34", "opponentTeamId": "tm13", "scoreOwn": 1, "scoreOpp": 0, "finish": null, "stage": "Полуфинал"}, {"id": "m178", "date": "2024-01-27", "label": "Игровая тренировка 27.01.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m179", "date": "2024-01-28", "label": "турнир по хоккею г. Владивосток. Финал. Факел - Фанзавод 1:0", "categoryId": "tournament_match", "tournamentId": "t9", "ownTeamId": "tm34", "opponentTeamId": "tm35", "scoreOwn": 1, "scoreOpp": 0, "finish": null, "stage": "Финал"}, {"id": "m180", "date": "2024-01-28", "label": "УГО. Ветераны 4:12", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm6", "scoreOwn": 4, "scoreOpp": 12, "finish": null, "stage": null}, {"id": "m181", "date": "2024-02-03", "label": "Игровая тренировка 03.02.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m182", "date": "2024-02-10", "label": "Игровая тренировка 10.02.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m183", "date": "2024-02-11", "label": "турнир на приз главы Октябрьского Района. Легион Колос 5:3", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm16", "scoreOwn": 5, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m184", "date": "2024-02-11", "label": "турнир на приз главы Октябрьского Района. финал. Легион Шахтер 4:6", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": 4, "scoreOpp": 6, "finish": null, "stage": "Финал"}, {"id": "m185", "date": "2024-02-17", "label": "Игровая тренировка 17.02.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m186", "date": "2024-02-24", "label": "Игровая тренировка 24.02.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m187", "date": "2024-03-02", "label": "Игровая тренировка 02.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m188", "date": "2024-03-09", "label": "Игровая тренировка 09.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m189", "date": "2024-03-15", "label": "Игровая тренировка 15.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m190", "date": "2024-03-16", "label": "Игровая тренировка 16.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m191", "date": "2024-03-23", "label": "Игровая тренировка 23.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m192", "date": "2024-03-29", "label": "Игровая тренировка 29.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m193", "date": "2024-03-30", "label": "Игровая тренировка 30.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m194", "date": "2024-04-05", "label": "Игровая тренировка 05.04.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m195", "date": "2024-04-06", "label": "Игровая тренировка 06.04.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m196", "date": "2024-04-12", "label": "Игровая тренировка 12.04.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m197", "date": "2024-04-13", "label": "50+. Лавина - Ветераны 3:6", "categoryId": "tournament_match", "tournamentId": "t3", "ownTeamId": "tm17", "opponentTeamId": "tm6", "scoreOwn": 3, "scoreOpp": 6, "finish": null, "stage": null}, {"id": "m198", "date": "2024-04-14", "label": "УГО. Каскад 6:1", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm15", "scoreOwn": 6, "scoreOpp": 1, "finish": null, "stage": null}, {"id": "m199", "date": "2024-04-27", "label": "Игровая тренировка 27.04.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m200", "date": "2024-04-30", "label": "товарняк. ДВЖД - Водострой", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm10", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m201", "date": "2024-05-02", "label": "Игровая тренировка 02.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m202", "date": "2024-05-03", "label": "Игровая тренировка 03.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m203", "date": "2024-05-11", "label": "30+. Легион - Супротек 1:9", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": 1, "scoreOpp": 9, "finish": null, "stage": null}, {"id": "m204", "date": "2024-05-11", "label": "30+. Легион - Росмет 2:9", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm18", "opponentTeamId": "tm27", "scoreOwn": 2, "scoreOpp": 9, "finish": null, "stage": null}, {"id": "m205", "date": "2024-05-11", "label": "Игровая тренировка 11.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m206", "date": "2024-05-12", "label": "30+. Легион - ДВЖД 3:2", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm18", "opponentTeamId": "tm10", "scoreOwn": 3, "scoreOpp": 2, "finish": null, "stage": null}, {"id": "m207", "date": "2024-05-18", "label": "Игровая тренировка 18.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m208", "date": "2024-05-19", "label": "Игровая тренировка 19.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m209", "date": "2024-05-25", "label": "Игровая тренировка 25.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m210", "date": "2024-05-31", "label": "Игровая тренировка 31.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m211", "date": "2022-09-03", "label": "Игровая тренировка 03.09.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m212", "date": "2022-09-04", "label": "Игровая тренировка 04.09.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m213", "date": "2022-09-10", "label": "Игровая тренировка 10.09.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m214", "date": "2022-09-11", "label": "Игровая тренировка 11.09.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m215", "date": "2022-09-24", "label": "Игровая тренировка 24.09.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m216", "date": "2022-10-01", "label": "Игровая тренировка 01.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m217", "date": "2022-10-02", "label": "Игровая тренировка 02.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m218", "date": "2022-10-08", "label": "Игровая тренировка 08.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m219", "date": "2022-10-09", "label": "Игровая тренировка 09.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m220", "date": "2022-10-22", "label": "Игровая тренировка 22.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m221", "date": "2022-10-23", "label": "Игровая тренировка 23.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m222", "date": "2022-10-29", "label": "Игровая тренировка 29.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m223", "date": "2022-11-05", "label": "Игровая тренировка 05.11.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m224", "date": "2022-11-12", "label": "Игровая тренировка 12.11.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m225", "date": "2022-11-13", "label": "Игровая тренировка 13.11.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m226", "date": "2022-11-19", "label": "Игровая тренировка 19.11.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m227", "date": "2022-11-20", "label": "УГО. УСВУ", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm33", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m228", "date": "2022-11-26", "label": "Игровая тренировка 26.11.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m229", "date": "2022-12-03", "label": "Игровая тренировка 03.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m230", "date": "2022-12-04", "label": "УГО. Ветераны", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm6", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m231", "date": "2022-12-04", "label": "Игровая тренировка 04.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m232", "date": "2022-12-10", "label": "Игровая тренировка 10.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m233", "date": "2022-12-17", "label": "Игровая тренировка 17.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m234", "date": "2022-12-20", "label": "Игровая тренировка 20.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m235", "date": "2022-12-24", "label": "Игровая тренировка 24.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m236", "date": "2022-12-27", "label": "Игровая тренировка 27.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m237", "date": "2023-01-05", "label": "Игровая тренировка 05.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m238", "date": "2023-01-07", "label": "Игровая тренировка 07.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m239", "date": "2023-01-10", "label": "Игровая тренировка 10.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m240", "date": "2023-01-14", "label": "Игровая тренировка 14.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m241", "date": "2023-01-21", "label": "Игровая тренировка 21.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m242", "date": "2023-01-22", "label": "Игровая тренировка 22.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m243", "date": "2023-01-28", "label": "Игровая тренировка 28.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m244", "date": "2023-01-29", "label": "Игровая тренировка 29.01.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m245", "date": "2023-02-04", "label": "УГО. Витязь", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm7", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m246", "date": "2023-02-04", "label": "Игровая тренировка 04.02.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m247", "date": "2023-02-05", "label": "турнир на приз главы Октябрьского Района. Покровка", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm24", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m248", "date": "2023-02-05", "label": "турнир на приз главы Октябрьского Района. Липовцы", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m249", "date": "2023-02-14", "label": "Игровая тренировка 14.02.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m250", "date": "2023-02-18", "label": "Игровая тренировка 18.02.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m251", "date": "2023-02-26", "label": "УГО. Аларм", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm2", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m252", "date": "2023-03-04", "label": "Игровая тренировка 04.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m253", "date": "2023-03-07", "label": "Игровая тренировка 07.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m254", "date": "2023-03-11", "label": "Игровая тренировка 11.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m255", "date": "2023-03-18", "label": "Игровая тренировка 18.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m256", "date": "2023-03-19", "label": "Игровая тренировка 19.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m257", "date": "2023-03-25", "label": "Игровая тренировка 25.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m258", "date": "2023-03-26", "label": "Игровая тренировка 26.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m259", "date": "2023-03-28", "label": "Игровая тренировка 28.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m260", "date": "2023-04-01", "label": "Игровая тренировка 01.04.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m261", "date": "2023-04-02", "label": "Игровая тренировка 02.04.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m262", "date": "2023-04-04", "label": "товарняк. Водострой", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m263", "date": "2023-04-15", "label": "УГО. Супротек", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m264", "date": "2023-04-15", "label": "Игровая тренировка 15.04.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m265", "date": "2023-04-15", "label": "товарняк. ДетДом", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm11", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m266", "date": "2023-04-18", "label": "Игровая тренировка 18.04.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m267", "date": "2023-04-22", "label": "Игровая тренировка 22.04.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m268", "date": "2023-04-23", "label": "УГО. УСВУ", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm33", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m269", "date": "2023-04-25", "label": "товарняк. Водострой", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m270", "date": "2023-04-29", "label": "Игровая тренировка 29.04.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m271", "date": "2023-04-30", "label": "товарняк. Аларм", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm2", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m272", "date": "2023-05-02", "label": "товарняк. Водострой", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m273", "date": "2023-05-06", "label": "Игровая тренировка 06.05.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m274", "date": "2023-05-07", "label": "товарняк. Аларм", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm2", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m275", "date": "2023-05-13", "label": "Игровая тренировка 13.05.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m276", "date": "2023-05-14", "label": "товарняк. Супротек", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m277", "date": "2023-05-16", "label": "товарняк. Водострой", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m278", "date": "2023-05-20", "label": "Игровая тренировка 20.05.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m279", "date": "2023-05-23", "label": "Игровая тренировка 23.05.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m280", "date": "2023-05-27", "label": "Игровая тренировка 27.05.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m281", "date": "2023-05-30", "label": "товарняк. Водострой", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m282", "date": "2025-09-12", "label": "Игровая тренировка 12.09.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m283", "date": "2026-03-13", "label": "Игровая тренировка 13.03.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m284", "date": "2026-04-04", "label": "Игровая тренировка 04.04.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m285", "date": "2026-05-14", "label": "Игровая тренировка 14.05.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m286", "date": "2026-05-21", "label": "Игровая тренировка 21.05.2026", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m287", "date": "2024-09-21", "label": "товарняк. Легион - Акулы 1:9", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm1", "scoreOwn": 1, "scoreOpp": 9, "finish": null, "stage": null}, {"id": "m288", "date": "2024-11-18", "label": "Игровая тренировка 18.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m289", "date": "2024-12-07", "label": "Игровая тренировка 07.12.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m290", "date": "2025-02-15", "label": "турнир 35+.  Легион - Ветераны 2:7", "categoryId": "tournament_match", "tournamentId": "t2", "ownTeamId": "tm18", "opponentTeamId": "tm6", "scoreOwn": 2, "scoreOpp": 7, "finish": null, "stage": null}, {"id": "m291", "date": "2025-02-16", "label": "турнир 35+.  Легион - Каскад 0:4", "categoryId": "tournament_match", "tournamentId": "t2", "ownTeamId": "tm18", "opponentTeamId": "tm15", "scoreOwn": 0, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m292", "date": "2025-03-05", "label": "Игровая тренировка 05.03.2025", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m293", "date": "2023-10-21", "label": "Игровая тренировка 21.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m294", "date": "2023-11-18", "label": "Игровая тренировка 18.11.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m295", "date": "2023-12-03", "label": "УГО. Шахтер Липовцы 0:8", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": 0, "scoreOpp": 8, "finish": null, "stage": null}, {"id": "m296", "date": "2023-12-24", "label": "УГО. СУПРОТЕК 5:6 Б", "categoryId": "tournament_match", "tournamentId": "t7", "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": 5, "scoreOpp": 6, "finish": "Буллиты", "stage": null}, {"id": "m297", "date": "2024-01-20", "label": "Игровая тренировка 20.01.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m298", "date": "2024-03-01", "label": "Игровая тренировка 01.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m299", "date": "2024-03-17", "label": "Игровая тренировка 17.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m300", "date": "2024-03-22", "label": "Игровая тренировка 22.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m301", "date": "2022-10-15", "label": "Игровая тренировка 15.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m302", "date": "2023-02-25", "label": "Игровая тренировка 25.02.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m303", "date": "2023-04-08", "label": "Игровая тренировка 08.04.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m304", "date": "2023-04-08", "label": "товарняк. ДетДом", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm11", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m305", "date": "2024-10-14", "label": "Игровая тренировка 14.10.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m306", "date": "2024-10-19", "label": "играл ВРАТАРЁМ", "categoryId": "training_no_stats", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m307", "date": "2024-11-10", "label": "Игровая тренировка 10.11.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m308", "date": "2024-11-13", "label": "АХЛ. Легион - Доброфлот 7:5", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm12", "scoreOwn": 7, "scoreOpp": 5, "finish": null, "stage": null}, {"id": "m309", "date": "2024-12-08", "label": "АХЛ. Легион - Локомотив 8:2", "categoryId": "tournament_match", "tournamentId": "t4", "ownTeamId": "tm18", "opponentTeamId": "tm21", "scoreOwn": 8, "scoreOpp": 2, "finish": null, "stage": null}, {"id": "m310", "date": "2023-09-29", "label": "Игровая тренировка 29.09.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m311", "date": "2023-10-15", "label": "Игровая тренировка 15.10.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m312", "date": "2023-11-05", "label": "товарняк. СУПРОТЕК", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm31", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m313", "date": "2023-12-09", "label": "50+. ЛАВИНА - исток 1:3", "categoryId": "tournament_match", "tournamentId": "t3", "ownTeamId": "tm17", "opponentTeamId": "tm14", "scoreOwn": 1, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m314", "date": "2023-12-10", "label": "50+. ЛАВИНА-юность 3:5", "categoryId": "tournament_match", "tournamentId": "t3", "ownTeamId": "tm17", "opponentTeamId": "tm38", "scoreOwn": 3, "scoreOpp": 5, "finish": null, "stage": null}, {"id": "m315", "date": "2023-12-13", "label": "товарняк. Ветераны", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm18", "opponentTeamId": "tm6", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m316", "date": "2024-01-05", "label": "турнир на приз главы Октябрьского Района. Легион - Липовцы 4: 15", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm37", "scoreOwn": 4, "scoreOpp": 15, "finish": null, "stage": null}, {"id": "m317", "date": "2024-01-05", "label": "турнир на приз главы Октябрьского Района. Легион - Спартак 9:4", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm29", "scoreOwn": 9, "scoreOpp": 4, "finish": null, "stage": null}, {"id": "m318", "date": "2024-01-08", "label": "турнир по хоккею г. Владивосток. Факел - Ярость 4:0", "categoryId": "tournament_match", "tournamentId": "t9", "ownTeamId": "tm34", "opponentTeamId": "tm39", "scoreOwn": 4, "scoreOpp": 0, "finish": null, "stage": null}, {"id": "m319", "date": "2024-01-14", "label": "турнир по хоккею г. Владивосток. Факел - Змеинка 0:3", "categoryId": "tournament_match", "tournamentId": "t9", "ownTeamId": "tm34", "opponentTeamId": "tm13", "scoreOwn": 0, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m320", "date": "2024-01-20", "label": "турнир по хоккею г. Владивосток. Факел - Русский Остров 3:0", "categoryId": "tournament_match", "tournamentId": "t9", "ownTeamId": "tm34", "opponentTeamId": "tm28", "scoreOwn": 3, "scoreOpp": 0, "finish": null, "stage": null}, {"id": "m321", "date": "2024-02-09", "label": "Игровая тренировка 09.02.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m322", "date": "2024-02-11", "label": "турнир на приз главы Октябрьского Района.  Легион Колос 5:3", "categoryId": "tournament_match", "tournamentId": "t8", "ownTeamId": "tm18", "opponentTeamId": "tm16", "scoreOwn": 5, "scoreOpp": 3, "finish": null, "stage": null}, {"id": "m323", "date": "2024-02-16", "label": "Игровая тренировка 16.02.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m324", "date": "2024-02-26", "label": "Игровая тренировка 26.02.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m325", "date": "2024-03-14", "label": "Игровая тренировка 14.03.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m326", "date": "2024-04-03", "label": "Игровая тренировка 03.04.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m327", "date": "2024-04-07", "label": "Игровая тренировка 07.04.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m328", "date": "2024-05-07", "label": "товарняк. ДВЖД - Водострой", "categoryId": "friendly", "tournamentId": null, "ownTeamId": "tm10", "opponentTeamId": "tm8", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m329", "date": "2024-05-12", "label": "Игровая тренировка 12.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m330", "date": "2024-05-16", "label": "Игровая тренировка 16.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m331", "date": "2024-05-23", "label": "Игровая тренировка 23.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m332", "date": "2024-05-26", "label": "Игровая тренировка 26.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m333", "date": "2024-05-28", "label": "Игровая тренировка 28.05.2024", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m334", "date": "2022-10-13", "label": "Игровая тренировка 13.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m335", "date": "2022-10-16", "label": "Игровая тренировка 16.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m336", "date": "2022-10-18", "label": "Игровая тренировка 18.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m337", "date": "2022-10-27", "label": "Игровая тренировка 27.10.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m338", "date": "2022-12-25", "label": "Игровая тренировка 25.12.2022", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m339", "date": "2023-02-12", "label": "Игровая тренировка 12.02.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m340", "date": "2023-03-16", "label": "Игровая тренировка 16.03.2023", "categoryId": "training", "tournamentId": null, "ownTeamId": null, "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m341", "date": "2023-03-26", "label": "50+. Лавина - Ветераны", "categoryId": "tournament_match", "tournamentId": "t3", "ownTeamId": "tm17", "opponentTeamId": "tm6", "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m342", "date": "2023-05-20", "label": "турнир 30+. (играл за Ветеранов)", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm6", "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}, {"id": "m343", "date": "2023-05-21", "label": "турнир 30+. (играл за Ветеранов)", "categoryId": "tournament_match", "tournamentId": "t1", "ownTeamId": "tm6", "opponentTeamId": null, "scoreOwn": null, "scoreOpp": null, "finish": null, "stage": null}];

const SEED_ENTRIES = [{"id": "e1", "player": "Андрей", "date": "2026-09-05", "goals": 1, "assists": 0, "matchId": "m1"}, {"id": "e2", "player": "Андрей", "date": "2026-09-11", "goals": 1, "assists": 1, "matchId": "m2"}, {"id": "e3", "player": "Андрей", "date": "2025-09-06", "goals": 3, "assists": 0, "matchId": "m3"}, {"id": "e4", "player": "Андрей", "date": "2025-09-06", "goals": 0, "assists": 2, "matchId": "m3"}, {"id": "e5", "player": "Андрей", "date": "2025-09-13", "goals": 2, "assists": 2, "matchId": "m4"}, {"id": "e6", "player": "Андрей", "date": "2025-09-13", "goals": 3, "assists": 1, "matchId": "m4"}, {"id": "e7", "player": "Андрей", "date": "2025-09-14", "goals": 3, "assists": 1, "matchId": "m5"}, {"id": "e8", "player": "Андрей", "date": "2025-09-21", "goals": 1, "assists": 2, "matchId": "m6"}, {"id": "e9", "player": "Андрей", "date": "2025-09-28", "goals": 3, "assists": 3, "matchId": "m7"}, {"id": "e10", "player": "Андрей", "date": "2025-10-03", "goals": 0, "assists": 0, "matchId": "m8"}, {"id": "e11", "player": "Андрей", "date": "2025-10-04", "goals": 1, "assists": 0, "matchId": "m9"}, {"id": "e12", "player": "Андрей", "date": "2025-10-04", "goals": 1, "assists": 2, "matchId": "m9"}, {"id": "e13", "player": "Андрей", "date": "2025-10-11", "goals": 1, "assists": 0, "matchId": "m10"}, {"id": "e14", "player": "Андрей", "date": "2025-10-12", "goals": 0, "assists": 1, "matchId": "m11"}, {"id": "e15", "player": "Андрей", "date": "2025-10-17", "goals": 4, "assists": 2, "matchId": "m12"}, {"id": "e16", "player": "Андрей", "date": "2025-10-18", "goals": 1, "assists": 1, "matchId": "m13"}, {"id": "e17", "player": "Андрей", "date": "2025-10-25", "goals": 1, "assists": 4, "matchId": "m14"}, {"id": "e18", "player": "Андрей", "date": "2025-11-01", "goals": 2, "assists": 1, "matchId": "m15"}, {"id": "e19", "player": "Андрей", "date": "2025-11-04", "goals": 1, "assists": 1, "matchId": "m16"}, {"id": "e20", "player": "Андрей", "date": "2025-11-08", "goals": 1, "assists": 0, "matchId": "m17"}, {"id": "e21", "player": "Андрей", "date": "2025-11-08", "goals": 3, "assists": 2, "matchId": "m18"}, {"id": "e22", "player": "Андрей", "date": "2025-11-15", "goals": 0, "assists": 0, "matchId": "m19"}, {"id": "e23", "player": "Андрей", "date": "2025-11-15", "goals": 0, "assists": 1, "matchId": "m20"}, {"id": "e24", "player": "Андрей", "date": "2025-11-16", "goals": 0, "assists": 0, "matchId": "m21"}, {"id": "e25", "player": "Андрей", "date": "2025-11-23", "goals": 3, "assists": 1, "matchId": "m22"}, {"id": "e26", "player": "Андрей", "date": "2025-11-25", "goals": 1, "assists": 1, "matchId": "m23"}, {"id": "e27", "player": "Андрей", "date": "2025-11-29", "goals": 0, "assists": 0, "matchId": "m24"}, {"id": "e28", "player": "Андрей", "date": "2025-11-30", "goals": 0, "assists": 1, "matchId": "m25"}, {"id": "e29", "player": "Андрей", "date": "2025-12-05", "goals": 0, "assists": 2, "matchId": "m26"}, {"id": "e30", "player": "Андрей", "date": "2025-12-06", "goals": 1, "assists": 1, "matchId": "m27"}, {"id": "e31", "player": "Андрей", "date": "2025-12-12", "goals": 0, "assists": 0, "matchId": "m28"}, {"id": "e32", "player": "Андрей", "date": "2025-12-13", "goals": 1, "assists": 1, "matchId": "m29"}, {"id": "e33", "player": "Андрей", "date": "2025-12-20", "goals": 2, "assists": 4, "matchId": "m30"}, {"id": "e34", "player": "Андрей", "date": "2025-12-20", "goals": 1, "assists": 0, "matchId": "m30"}, {"id": "e35", "player": "Андрей", "date": "2025-12-25", "goals": 1, "assists": 1, "matchId": "m31"}, {"id": "e36", "player": "Андрей", "date": "2025-12-27", "goals": 1, "assists": 1, "matchId": "m32"}, {"id": "e37", "player": "Андрей", "date": "2025-12-28", "goals": 0, "assists": 1, "matchId": "m33"}, {"id": "e38", "player": "Андрей", "date": "2025-12-28", "goals": 0, "assists": 2, "matchId": "m34"}, {"id": "e39", "player": "Андрей", "date": "2026-01-09", "goals": 0, "assists": 0, "matchId": "m35"}, {"id": "e40", "player": "Андрей", "date": "2026-01-09", "goals": 0, "assists": 2, "matchId": "m36"}, {"id": "e41", "player": "Андрей", "date": "2026-01-10", "goals": 2, "assists": 1, "matchId": "m37"}, {"id": "e42", "player": "Андрей", "date": "2026-01-16", "goals": 2, "assists": 2, "matchId": "m38"}, {"id": "e43", "player": "Андрей", "date": "2026-01-17", "goals": 1, "assists": 2, "matchId": "m39"}, {"id": "e44", "player": "Андрей", "date": "2026-01-18", "goals": 1, "assists": 3, "matchId": "m40"}, {"id": "e45", "player": "Андрей", "date": "2026-01-22", "goals": 0, "assists": 0, "matchId": "m41"}, {"id": "e46", "player": "Андрей", "date": "2026-01-23", "goals": 1, "assists": 3, "matchId": "m42"}, {"id": "e47", "player": "Андрей", "date": "2026-01-24", "goals": 1, "assists": 3, "matchId": "m43"}, {"id": "e48", "player": "Андрей", "date": "2026-01-27", "goals": 0, "assists": 2, "matchId": "m44"}, {"id": "e49", "player": "Андрей", "date": "2026-01-30", "goals": 2, "assists": 4, "matchId": "m45"}, {"id": "e50", "player": "Андрей", "date": "2026-01-31", "goals": 1, "assists": 3, "matchId": "m46"}, {"id": "e51", "player": "Андрей", "date": "2026-02-06", "goals": 0, "assists": 1, "matchId": "m47"}, {"id": "e52", "player": "Андрей", "date": "2026-02-07", "goals": 6, "assists": 1, "matchId": "m48"}, {"id": "e53", "player": "Андрей", "date": "2026-02-08", "goals": 0, "assists": 1, "matchId": "m49"}, {"id": "e54", "player": "Андрей", "date": "2026-02-13", "goals": 0, "assists": 2, "matchId": "m50"}, {"id": "e55", "player": "Андрей", "date": "2026-02-18", "goals": 0, "assists": 1, "matchId": "m51"}, {"id": "e56", "player": "Андрей", "date": "2026-02-19", "goals": 0, "assists": 1, "matchId": "m52"}, {"id": "e57", "player": "Андрей", "date": "2026-02-20", "goals": 0, "assists": 3, "matchId": "m53"}, {"id": "e58", "player": "Андрей", "date": "2026-02-27", "goals": 1, "assists": 2, "matchId": "m54"}, {"id": "e59", "player": "Андрей", "date": "2026-02-28", "goals": 1, "assists": 2, "matchId": "m55"}, {"id": "e60", "player": "Андрей", "date": "2026-03-06", "goals": 0, "assists": 2, "matchId": "m56"}, {"id": "e61", "player": "Андрей", "date": "2026-03-07", "goals": 2, "assists": 0, "matchId": "m57"}, {"id": "e62", "player": "Андрей", "date": "2026-03-09", "goals": 2, "assists": 2, "matchId": "m58"}, {"id": "e63", "player": "Андрей", "date": "2026-03-14", "goals": 3, "assists": 1, "matchId": "m59"}, {"id": "e64", "player": "Андрей", "date": "2026-03-21", "goals": 2, "assists": 2, "matchId": "m60"}, {"id": "e65", "player": "Андрей", "date": "2026-03-22", "goals": 1, "assists": 1, "matchId": "m61"}, {"id": "e66", "player": "Андрей", "date": "2026-03-28", "goals": 3, "assists": 1, "matchId": "m62"}, {"id": "e67", "player": "Андрей", "date": "2026-03-28", "goals": 0, "assists": 0, "matchId": "m63"}, {"id": "e68", "player": "Андрей", "date": "2026-03-30", "goals": 0, "assists": 1, "matchId": "m64"}, {"id": "e69", "player": "Андрей", "date": "2026-04-06", "goals": 1, "assists": 2, "matchId": "m65"}, {"id": "e70", "player": "Андрей", "date": "2026-04-11", "goals": 2, "assists": 2, "matchId": "m66"}, {"id": "e71", "player": "Андрей", "date": "2026-04-17", "goals": 2, "assists": 0, "matchId": "m67"}, {"id": "e72", "player": "Андрей", "date": "2026-04-25", "goals": 2, "assists": 2, "matchId": "m68"}, {"id": "e73", "player": "Андрей", "date": "2026-05-02", "goals": 0, "assists": 0, "matchId": "m69"}, {"id": "e74", "player": "Андрей", "date": "2026-05-02", "goals": 0, "assists": 0, "matchId": "m70"}, {"id": "e75", "player": "Андрей", "date": "2026-05-02", "goals": 1, "assists": 0, "matchId": "m71"}, {"id": "e76", "player": "Андрей", "date": "2026-05-03", "goals": 0, "assists": 0, "matchId": "m72"}, {"id": "e77", "player": "Андрей", "date": "2026-05-07", "goals": 0, "assists": 2, "matchId": "m73"}, {"id": "e78", "player": "Андрей", "date": "2026-05-17", "goals": 0, "assists": 3, "matchId": "m74"}, {"id": "e79", "player": "Андрей", "date": "2026-05-23", "goals": 1, "assists": 0, "matchId": "m75"}, {"id": "e80", "player": "Андрей", "date": "2026-05-23", "goals": 0, "assists": 1, "matchId": "m76"}, {"id": "e81", "player": "Андрей", "date": "2026-05-23", "goals": 2, "assists": 1, "matchId": "m77"}, {"id": "e82", "player": "Андрей", "date": "2026-05-23", "goals": 0, "assists": 1, "matchId": "m78"}, {"id": "e83", "player": "Андрей", "date": "2026-05-23", "goals": 0, "assists": 0, "matchId": "m79"}, {"id": "e84", "player": "Андрей", "date": "2024-09-14", "goals": 0, "assists": 2, "matchId": "m80"}, {"id": "e85", "player": "Андрей", "date": "2024-09-18", "goals": 0, "assists": 4, "matchId": "m81"}, {"id": "e86", "player": "Андрей", "date": "2024-09-21", "goals": 0, "assists": 0, "matchId": "m82"}, {"id": "e87", "player": "Андрей", "date": "2024-09-22", "goals": 1, "assists": 4, "matchId": "m83"}, {"id": "e88", "player": "Андрей", "date": "2024-09-25", "goals": 0, "assists": 5, "matchId": "m84"}, {"id": "e89", "player": "Андрей", "date": "2024-09-27", "goals": 0, "assists": 1, "matchId": "m85"}, {"id": "e90", "player": "Андрей", "date": "2024-09-28", "goals": 1, "assists": 6, "matchId": "m86"}, {"id": "e91", "player": "Андрей", "date": "2024-10-04", "goals": 1, "assists": 4, "matchId": "m87"}, {"id": "e92", "player": "Андрей", "date": "2024-10-05", "goals": 0, "assists": 4, "matchId": "m88"}, {"id": "e93", "player": "Андрей", "date": "2024-10-11", "goals": 1, "assists": 1, "matchId": "m89"}, {"id": "e94", "player": "Андрей", "date": "2024-10-12", "goals": 2, "assists": 4, "matchId": "m90"}, {"id": "e95", "player": "Андрей", "date": "2024-10-13", "goals": 0, "assists": 2, "matchId": "m91"}, {"id": "e96", "player": "Андрей", "date": "2024-10-16", "goals": 1, "assists": 1, "matchId": "m92"}, {"id": "e97", "player": "Андрей", "date": "2024-10-18", "goals": 0, "assists": 1, "matchId": "m93"}, {"id": "e98", "player": "Андрей", "date": "2024-10-19", "goals": 1, "assists": 2, "matchId": "m94"}, {"id": "e99", "player": "Андрей", "date": "2024-10-21", "goals": 0, "assists": 2, "matchId": "m95"}, {"id": "e100", "player": "Андрей", "date": "2024-10-26", "goals": 0, "assists": 0, "matchId": "m96"}, {"id": "e101", "player": "Андрей", "date": "2024-10-26", "goals": 0, "assists": 2, "matchId": "m97"}, {"id": "e102", "player": "Андрей", "date": "2024-10-30", "goals": 0, "assists": 0, "matchId": "m98"}, {"id": "e103", "player": "Андрей", "date": "2024-11-01", "goals": 1, "assists": 1, "matchId": "m99"}, {"id": "e104", "player": "Андрей", "date": "2024-11-02", "goals": 4, "assists": 1, "matchId": "m100"}, {"id": "e105", "player": "Андрей", "date": "2024-11-09", "goals": 0, "assists": 3, "matchId": "m101"}, {"id": "e106", "player": "Андрей", "date": "2024-11-16", "goals": 0, "assists": 2, "matchId": "m102"}, {"id": "e107", "player": "Андрей", "date": "2024-11-17", "goals": 0, "assists": 0, "matchId": "m103"}, {"id": "e108", "player": "Андрей", "date": "2024-11-23", "goals": 0, "assists": 0, "matchId": "m104"}, {"id": "e109", "player": "Андрей", "date": "2024-11-27", "goals": 0, "assists": 2, "matchId": "m105"}, {"id": "e110", "player": "Андрей", "date": "2024-11-30", "goals": 1, "assists": 2, "matchId": "m106"}, {"id": "e111", "player": "Андрей", "date": "2024-12-01", "goals": 0, "assists": 0, "matchId": "m107"}, {"id": "e112", "player": "Андрей", "date": "2024-12-13", "goals": 1, "assists": 1, "matchId": "m108"}, {"id": "e113", "player": "Андрей", "date": "2024-12-14", "goals": 1, "assists": 1, "matchId": "m109"}, {"id": "e114", "player": "Андрей", "date": "2024-12-18", "goals": 0, "assists": 3, "matchId": "m110"}, {"id": "e115", "player": "Андрей", "date": "2024-12-20", "goals": 0, "assists": 2, "matchId": "m111"}, {"id": "e116", "player": "Андрей", "date": "2024-12-21", "goals": 2, "assists": 3, "matchId": "m112"}, {"id": "e117", "player": "Андрей", "date": "2024-12-28", "goals": 0, "assists": 1, "matchId": "m113"}, {"id": "e118", "player": "Андрей", "date": "2025-01-11", "goals": 0, "assists": 2, "matchId": "m114"}, {"id": "e119", "player": "Андрей", "date": "2025-01-17", "goals": 0, "assists": 0, "matchId": "m115"}, {"id": "e120", "player": "Андрей", "date": "2025-01-18", "goals": 2, "assists": 0, "matchId": "m116"}, {"id": "e121", "player": "Андрей", "date": "2025-01-24", "goals": 0, "assists": 1, "matchId": "m117"}, {"id": "e122", "player": "Андрей", "date": "2025-01-25", "goals": 0, "assists": 0, "matchId": "m118"}, {"id": "e123", "player": "Андрей", "date": "2025-01-26", "goals": 0, "assists": 1, "matchId": "m119"}, {"id": "e124", "player": "Андрей", "date": "2025-01-29", "goals": 0, "assists": 1, "matchId": "m120"}, {"id": "e125", "player": "Андрей", "date": "2025-02-01", "goals": 1, "assists": 1, "matchId": "m121"}, {"id": "e126", "player": "Андрей", "date": "2025-02-07", "goals": 1, "assists": 1, "matchId": "m122"}, {"id": "e127", "player": "Андрей", "date": "2025-02-08", "goals": 0, "assists": 0, "matchId": "m123"}, {"id": "e128", "player": "Андрей", "date": "2025-02-08", "goals": 2, "assists": 0, "matchId": "m124"}, {"id": "e129", "player": "Андрей", "date": "2025-02-12", "goals": 0, "assists": 1, "matchId": "m125"}, {"id": "e130", "player": "Андрей", "date": "2025-02-14", "goals": 0, "assists": 2, "matchId": "m126"}, {"id": "e131", "player": "Андрей", "date": "2025-02-15", "goals": 0, "assists": 0, "matchId": "m127"}, {"id": "e132", "player": "Андрей", "date": "2025-02-15", "goals": 1, "assists": 0, "matchId": "m128"}, {"id": "e133", "player": "Андрей", "date": "2025-02-16", "goals": 0, "assists": 0, "matchId": "m129"}, {"id": "e134", "player": "Андрей", "date": "2025-03-01", "goals": 0, "assists": 0, "matchId": "m130"}, {"id": "e135", "player": "Андрей", "date": "2025-03-02", "goals": 0, "assists": 0, "matchId": "m131"}, {"id": "e136", "player": "Андрей", "date": "2025-03-12", "goals": 0, "assists": 4, "matchId": "m132"}, {"id": "e137", "player": "Андрей", "date": "2025-03-13", "goals": 1, "assists": 0, "matchId": "m133"}, {"id": "e138", "player": "Андрей", "date": "2025-03-15", "goals": 0, "assists": 3, "matchId": "m134"}, {"id": "e139", "player": "Андрей", "date": "2025-03-16", "goals": 0, "assists": 0, "matchId": "m135"}, {"id": "e140", "player": "Андрей", "date": "2025-03-22", "goals": 1, "assists": 1, "matchId": "m136"}, {"id": "e141", "player": "Андрей", "date": "2025-03-29", "goals": 1, "assists": 0, "matchId": "m137"}, {"id": "e142", "player": "Андрей", "date": "2025-04-05", "goals": 1, "assists": 1, "matchId": "m138"}, {"id": "e143", "player": "Андрей", "date": "2025-04-06", "goals": 0, "assists": 0, "matchId": "m139"}, {"id": "e144", "player": "Андрей", "date": "2025-04-19", "goals": 2, "assists": 3, "matchId": "m140"}, {"id": "e145", "player": "Андрей", "date": "2025-04-26", "goals": 1, "assists": 1, "matchId": "m141"}, {"id": "e146", "player": "Андрей", "date": "2025-04-26", "goals": 2, "assists": 2, "matchId": "m141"}, {"id": "e147", "player": "Андрей", "date": "2025-05-03", "goals": 2, "assists": 1, "matchId": "m142"}, {"id": "e148", "player": "Андрей", "date": "2025-05-04", "goals": 1, "assists": 1, "matchId": "m143"}, {"id": "e149", "player": "Андрей", "date": "2025-05-08", "goals": 1, "assists": 1, "matchId": "m144"}, {"id": "e150", "player": "Андрей", "date": "2025-05-10", "goals": 0, "assists": 2, "matchId": "m145"}, {"id": "e151", "player": "Андрей", "date": "2025-05-17", "goals": 0, "assists": 3, "matchId": "m146"}, {"id": "e152", "player": "Андрей", "date": "2025-05-17", "goals": 4, "assists": 3, "matchId": "m146"}, {"id": "e153", "player": "Андрей", "date": "2025-05-24", "goals": 0, "assists": 2, "matchId": "m147"}, {"id": "e154", "player": "Андрей", "date": "2025-05-24", "goals": 0, "assists": 0, "matchId": "m148"}, {"id": "e155", "player": "Андрей", "date": "2025-05-24", "goals": 0, "assists": 1, "matchId": "m149"}, {"id": "e156", "player": "Андрей", "date": "2025-05-25", "goals": 0, "assists": 0, "matchId": "m150"}, {"id": "e157", "player": "Андрей", "date": "2025-05-27", "goals": 0, "assists": 2, "matchId": "m151"}, {"id": "e158", "player": "Андрей", "date": "2025-05-29", "goals": 0, "assists": 2, "matchId": "m152"}, {"id": "e159", "player": "Андрей", "date": "2023-09-30", "goals": 1, "assists": 0, "matchId": "m153"}, {"id": "e160", "player": "Андрей", "date": "2023-10-07", "goals": 2, "assists": 0, "matchId": "m154"}, {"id": "e161", "player": "Андрей", "date": "2023-10-08", "goals": 0, "assists": 1, "matchId": "m155"}, {"id": "e162", "player": "Андрей", "date": "2023-10-09", "goals": 1, "assists": 1, "matchId": "m156"}, {"id": "e163", "player": "Андрей", "date": "2023-10-14", "goals": 0, "assists": 1, "matchId": "m157"}, {"id": "e164", "player": "Андрей", "date": "2023-10-28", "goals": 1, "assists": 3, "matchId": "m158"}, {"id": "e165", "player": "Андрей", "date": "2023-10-31", "goals": 2, "assists": 2, "matchId": "m159"}, {"id": "e166", "player": "Андрей", "date": "2023-11-04", "goals": 3, "assists": 0, "matchId": "m160"}, {"id": "e167", "player": "Андрей", "date": "2023-11-05", "goals": 0, "assists": 2, "matchId": "m161"}, {"id": "e168", "player": "Андрей", "date": "2023-11-07", "goals": 0, "assists": 2, "matchId": "m162"}, {"id": "e169", "player": "Андрей", "date": "2023-11-11", "goals": 2, "assists": 2, "matchId": "m163"}, {"id": "e170", "player": "Андрей", "date": "2023-11-12", "goals": 0, "assists": 2, "matchId": "m164"}, {"id": "e171", "player": "Андрей", "date": "2023-11-14", "goals": 0, "assists": 1, "matchId": "m165"}, {"id": "e172", "player": "Андрей", "date": "2023-11-25", "goals": 1, "assists": 3, "matchId": "m166"}, {"id": "e173", "player": "Андрей", "date": "2023-12-02", "goals": 2, "assists": 0, "matchId": "m167"}, {"id": "e174", "player": "Андрей", "date": "2023-12-03", "goals": 0, "assists": 0, "matchId": "m168"}, {"id": "e175", "player": "Андрей", "date": "2023-12-09", "goals": 2, "assists": 1, "matchId": "m169"}, {"id": "e176", "player": "Андрей", "date": "2023-12-10", "goals": 0, "assists": 1, "matchId": "m170"}, {"id": "e177", "player": "Андрей", "date": "2023-12-13", "goals": 2, "assists": 0, "matchId": "m171"}, {"id": "e178", "player": "Андрей", "date": "2023-12-16", "goals": 1, "assists": 1, "matchId": "m172"}, {"id": "e179", "player": "Андрей", "date": "2023-12-17", "goals": 0, "assists": 0, "matchId": "m173"}, {"id": "e180", "player": "Андрей", "date": "2023-12-23", "goals": 2, "assists": 3, "matchId": "m174"}, {"id": "e181", "player": "Андрей", "date": "2023-12-30", "goals": 0, "assists": 4, "matchId": "m175"}, {"id": "e182", "player": "Андрей", "date": "2024-01-13", "goals": 0, "assists": 4, "matchId": "m176"}, {"id": "e183", "player": "Андрей", "date": "2024-01-27", "goals": 0, "assists": 0, "matchId": "m177"}, {"id": "e184", "player": "Андрей", "date": "2024-01-27", "goals": 2, "assists": 2, "matchId": "m178"}, {"id": "e185", "player": "Андрей", "date": "2024-01-28", "goals": 0, "assists": 0, "matchId": "m179"}, {"id": "e186", "player": "Андрей", "date": "2024-01-28", "goals": 0, "assists": 0, "matchId": "m180"}, {"id": "e187", "player": "Андрей", "date": "2024-02-03", "goals": 0, "assists": 1, "matchId": "m181"}, {"id": "e188", "player": "Андрей", "date": "2024-02-10", "goals": 1, "assists": 3, "matchId": "m182"}, {"id": "e189", "player": "Андрей", "date": "2024-02-11", "goals": 0, "assists": 2, "matchId": "m183"}, {"id": "e190", "player": "Андрей", "date": "2024-02-11", "goals": 0, "assists": 1, "matchId": "m184"}, {"id": "e191", "player": "Андрей", "date": "2024-02-17", "goals": 1, "assists": 4, "matchId": "m185"}, {"id": "e192", "player": "Андрей", "date": "2024-02-24", "goals": 0, "assists": 2, "matchId": "m186"}, {"id": "e193", "player": "Андрей", "date": "2024-03-02", "goals": 2, "assists": 0, "matchId": "m187"}, {"id": "e194", "player": "Андрей", "date": "2024-03-09", "goals": 0, "assists": 0, "matchId": "m188"}, {"id": "e195", "player": "Андрей", "date": "2024-03-15", "goals": 3, "assists": 5, "matchId": "m189"}, {"id": "e196", "player": "Андрей", "date": "2024-03-16", "goals": 1, "assists": 0, "matchId": "m190"}, {"id": "e197", "player": "Андрей", "date": "2024-03-23", "goals": 2, "assists": 6, "matchId": "m191"}, {"id": "e198", "player": "Андрей", "date": "2024-03-29", "goals": 2, "assists": 2, "matchId": "m192"}, {"id": "e199", "player": "Андрей", "date": "2024-03-30", "goals": 3, "assists": 2, "matchId": "m193"}, {"id": "e200", "player": "Андрей", "date": "2024-04-05", "goals": 0, "assists": 0, "matchId": "m194"}, {"id": "e201", "player": "Андрей", "date": "2024-04-06", "goals": 0, "assists": 1, "matchId": "m195"}, {"id": "e202", "player": "Андрей", "date": "2024-04-12", "goals": 0, "assists": 0, "matchId": "m196"}, {"id": "e203", "player": "Андрей", "date": "2024-04-13", "goals": 0, "assists": 1, "matchId": "m197"}, {"id": "e204", "player": "Андрей", "date": "2024-04-14", "goals": 0, "assists": 1, "matchId": "m198"}, {"id": "e205", "player": "Андрей", "date": "2024-04-27", "goals": 3, "assists": 2, "matchId": "m199"}, {"id": "e206", "player": "Андрей", "date": "2024-04-30", "goals": 1, "assists": 1, "matchId": "m200"}, {"id": "e207", "player": "Андрей", "date": "2024-05-02", "goals": 2, "assists": 0, "matchId": "m201"}, {"id": "e208", "player": "Андрей", "date": "2024-05-03", "goals": 0, "assists": 2, "matchId": "m202"}, {"id": "e209", "player": "Андрей", "date": "2024-05-11", "goals": 0, "assists": 0, "matchId": "m203"}, {"id": "e210", "player": "Андрей", "date": "2024-05-11", "goals": 1, "assists": 0, "matchId": "m204"}, {"id": "e211", "player": "Андрей", "date": "2024-05-11", "goals": 1, "assists": 4, "matchId": "m205"}, {"id": "e212", "player": "Андрей", "date": "2024-05-12", "goals": 1, "assists": 0, "matchId": "m206"}, {"id": "e213", "player": "Андрей", "date": "2024-05-18", "goals": 4, "assists": 4, "matchId": "m207"}, {"id": "e214", "player": "Андрей", "date": "2024-05-19", "goals": 2, "assists": 3, "matchId": "m208"}, {"id": "e215", "player": "Андрей", "date": "2024-05-25", "goals": 3, "assists": 4, "matchId": "m209"}, {"id": "e216", "player": "Андрей", "date": "2024-05-31", "goals": 0, "assists": 2, "matchId": "m210"}, {"id": "e217", "player": "Андрей", "date": "2022-09-03", "goals": 3, "assists": 1, "matchId": "m211"}, {"id": "e218", "player": "Андрей", "date": "2022-09-04", "goals": 0, "assists": 3, "matchId": "m212"}, {"id": "e219", "player": "Андрей", "date": "2022-09-10", "goals": 2, "assists": 0, "matchId": "m213"}, {"id": "e220", "player": "Андрей", "date": "2022-09-11", "goals": 2, "assists": 0, "matchId": "m214"}, {"id": "e221", "player": "Андрей", "date": "2022-09-24", "goals": 2, "assists": 1, "matchId": "m215"}, {"id": "e222", "player": "Андрей", "date": "2022-10-01", "goals": 1, "assists": 0, "matchId": "m216"}, {"id": "e223", "player": "Андрей", "date": "2022-10-02", "goals": 0, "assists": 1, "matchId": "m217"}, {"id": "e224", "player": "Андрей", "date": "2022-10-08", "goals": 3, "assists": 2, "matchId": "m218"}, {"id": "e225", "player": "Андрей", "date": "2022-10-09", "goals": 0, "assists": 2, "matchId": "m219"}, {"id": "e226", "player": "Андрей", "date": "2022-10-22", "goals": 4, "assists": 0, "matchId": "m220"}, {"id": "e227", "player": "Андрей", "date": "2022-10-23", "goals": 3, "assists": 0, "matchId": "m221"}, {"id": "e228", "player": "Андрей", "date": "2022-10-29", "goals": 2, "assists": 0, "matchId": "m222"}, {"id": "e229", "player": "Андрей", "date": "2022-11-05", "goals": 3, "assists": 0, "matchId": "m223"}, {"id": "e230", "player": "Андрей", "date": "2022-11-12", "goals": 0, "assists": 1, "matchId": "m224"}, {"id": "e231", "player": "Андрей", "date": "2022-11-13", "goals": 0, "assists": 1, "matchId": "m225"}, {"id": "e232", "player": "Андрей", "date": "2022-11-19", "goals": 2, "assists": 1, "matchId": "m226"}, {"id": "e233", "player": "Андрей", "date": "2022-11-20", "goals": 1, "assists": 2, "matchId": "m227"}, {"id": "e234", "player": "Андрей", "date": "2022-11-26", "goals": 2, "assists": 0, "matchId": "m228"}, {"id": "e235", "player": "Андрей", "date": "2022-12-03", "goals": 3, "assists": 3, "matchId": "m229"}, {"id": "e236", "player": "Андрей", "date": "2022-12-04", "goals": 1, "assists": 1, "matchId": "m230"}, {"id": "e237", "player": "Андрей", "date": "2022-12-04", "goals": 0, "assists": 0, "matchId": "m231"}, {"id": "e238", "player": "Андрей", "date": "2022-12-10", "goals": 3, "assists": 1, "matchId": "m232"}, {"id": "e239", "player": "Андрей", "date": "2022-12-17", "goals": 1, "assists": 1, "matchId": "m233"}, {"id": "e240", "player": "Андрей", "date": "2022-12-20", "goals": 8, "assists": 6, "matchId": "m234"}, {"id": "e241", "player": "Андрей", "date": "2022-12-24", "goals": 2, "assists": 1, "matchId": "m235"}, {"id": "e242", "player": "Андрей", "date": "2022-12-27", "goals": 2, "assists": 0, "matchId": "m236"}, {"id": "e243", "player": "Андрей", "date": "2023-01-05", "goals": 1, "assists": 1, "matchId": "m237"}, {"id": "e244", "player": "Андрей", "date": "2023-01-07", "goals": 2, "assists": 1, "matchId": "m238"}, {"id": "e245", "player": "Андрей", "date": "2023-01-10", "goals": 0, "assists": 2, "matchId": "m239"}, {"id": "e246", "player": "Андрей", "date": "2023-01-14", "goals": 0, "assists": 1, "matchId": "m240"}, {"id": "e247", "player": "Андрей", "date": "2023-01-21", "goals": 0, "assists": 3, "matchId": "m241"}, {"id": "e248", "player": "Андрей", "date": "2023-01-22", "goals": 2, "assists": 0, "matchId": "m242"}, {"id": "e249", "player": "Андрей", "date": "2023-01-28", "goals": 3, "assists": 0, "matchId": "m243"}, {"id": "e250", "player": "Андрей", "date": "2023-01-29", "goals": 0, "assists": 2, "matchId": "m244"}, {"id": "e251", "player": "Андрей", "date": "2023-02-04", "goals": 0, "assists": 2, "matchId": "m245"}, {"id": "e252", "player": "Андрей", "date": "2023-02-04", "goals": 2, "assists": 3, "matchId": "m246"}, {"id": "e253", "player": "Андрей", "date": "2023-02-05", "goals": 0, "assists": 0, "matchId": "m247"}, {"id": "e254", "player": "Андрей", "date": "2023-02-05", "goals": 2, "assists": 0, "matchId": "m248"}, {"id": "e255", "player": "Андрей", "date": "2023-02-14", "goals": 1, "assists": 0, "matchId": "m249"}, {"id": "e256", "player": "Андрей", "date": "2023-02-18", "goals": 1, "assists": 1, "matchId": "m250"}, {"id": "e257", "player": "Андрей", "date": "2023-02-26", "goals": 0, "assists": 0, "matchId": "m251"}, {"id": "e258", "player": "Андрей", "date": "2023-03-04", "goals": 2, "assists": 3, "matchId": "m252"}, {"id": "e259", "player": "Андрей", "date": "2023-03-07", "goals": 1, "assists": 1, "matchId": "m253"}, {"id": "e260", "player": "Андрей", "date": "2023-03-11", "goals": 0, "assists": 0, "matchId": "m254"}, {"id": "e261", "player": "Андрей", "date": "2023-03-18", "goals": 1, "assists": 0, "matchId": "m255"}, {"id": "e262", "player": "Андрей", "date": "2023-03-19", "goals": 3, "assists": 2, "matchId": "m256"}, {"id": "e263", "player": "Андрей", "date": "2023-03-25", "goals": 3, "assists": 3, "matchId": "m257"}, {"id": "e264", "player": "Андрей", "date": "2023-03-26", "goals": 1, "assists": 1, "matchId": "m258"}, {"id": "e265", "player": "Андрей", "date": "2023-03-28", "goals": 2, "assists": 2, "matchId": "m259"}, {"id": "e266", "player": "Андрей", "date": "2023-04-01", "goals": 1, "assists": 0, "matchId": "m260"}, {"id": "e267", "player": "Андрей", "date": "2023-04-02", "goals": 1, "assists": 1, "matchId": "m261"}, {"id": "e268", "player": "Андрей", "date": "2023-04-04", "goals": 1, "assists": 1, "matchId": "m262"}, {"id": "e269", "player": "Андрей", "date": "2023-04-15", "goals": 0, "assists": 0, "matchId": "m263"}, {"id": "e270", "player": "Андрей", "date": "2023-04-15", "goals": 2, "assists": 5, "matchId": "m264"}, {"id": "e271", "player": "Андрей", "date": "2023-04-15", "goals": 1, "assists": 5, "matchId": "m265"}, {"id": "e272", "player": "Андрей", "date": "2023-04-18", "goals": 1, "assists": 0, "matchId": "m266"}, {"id": "e273", "player": "Андрей", "date": "2023-04-22", "goals": 5, "assists": 4, "matchId": "m267"}, {"id": "e274", "player": "Андрей", "date": "2023-04-23", "goals": 0, "assists": 1, "matchId": "m268"}, {"id": "e275", "player": "Андрей", "date": "2023-04-25", "goals": 0, "assists": 0, "matchId": "m269"}, {"id": "e276", "player": "Андрей", "date": "2023-04-29", "goals": 3, "assists": 1, "matchId": "m270"}, {"id": "e277", "player": "Андрей", "date": "2023-04-30", "goals": 1, "assists": 1, "matchId": "m271"}, {"id": "e278", "player": "Андрей", "date": "2023-05-02", "goals": 0, "assists": 0, "matchId": "m272"}, {"id": "e279", "player": "Андрей", "date": "2023-05-06", "goals": 2, "assists": 2, "matchId": "m273"}, {"id": "e280", "player": "Андрей", "date": "2023-05-07", "goals": 2, "assists": 2, "matchId": "m274"}, {"id": "e281", "player": "Андрей", "date": "2023-05-13", "goals": 0, "assists": 1, "matchId": "m275"}, {"id": "e282", "player": "Андрей", "date": "2023-05-14", "goals": 0, "assists": 0, "matchId": "m276"}, {"id": "e283", "player": "Андрей", "date": "2023-05-16", "goals": 1, "assists": 0, "matchId": "m277"}, {"id": "e284", "player": "Андрей", "date": "2023-05-20", "goals": 1, "assists": 0, "matchId": "m278"}, {"id": "e285", "player": "Андрей", "date": "2023-05-23", "goals": 0, "assists": 0, "matchId": "m279"}, {"id": "e286", "player": "Андрей", "date": "2023-05-27", "goals": 1, "assists": 0, "matchId": "m280"}, {"id": "e287", "player": "Андрей", "date": "2023-05-30", "goals": 1, "assists": 2, "matchId": "m281"}, {"id": "e288", "player": "Валёк", "date": "2026-09-05", "goals": 1, "assists": 3, "matchId": "m1"}, {"id": "e289", "player": "Валёк", "date": "2025-09-12", "goals": 0, "assists": 0, "matchId": "m282"}, {"id": "e290", "player": "Валёк", "date": "2025-09-13", "goals": 0, "assists": 0, "matchId": "m4"}, {"id": "e291", "player": "Валёк", "date": "2025-09-13", "goals": 1, "assists": 1, "matchId": "m4"}, {"id": "e292", "player": "Валёк", "date": "2025-11-15", "goals": 1, "assists": 1, "matchId": "m20"}, {"id": "e293", "player": "Валёк", "date": "2025-11-16", "goals": 0, "assists": 2, "matchId": "m21"}, {"id": "e294", "player": "Валёк", "date": "2025-12-05", "goals": 1, "assists": 1, "matchId": "m26"}, {"id": "e295", "player": "Валёк", "date": "2025-12-06", "goals": 0, "assists": 2, "matchId": "m27"}, {"id": "e296", "player": "Валёк", "date": "2026-01-17", "goals": 1, "assists": 1, "matchId": "m39"}, {"id": "e297", "player": "Валёк", "date": "2026-01-24", "goals": 0, "assists": 4, "matchId": "m43"}, {"id": "e298", "player": "Валёк", "date": "2026-01-30", "goals": 0, "assists": 3, "matchId": "m45"}, {"id": "e299", "player": "Валёк", "date": "2026-01-31", "goals": 2, "assists": 3, "matchId": "m46"}, {"id": "e300", "player": "Валёк", "date": "2026-02-07", "goals": 0, "assists": 1, "matchId": "m48"}, {"id": "e301", "player": "Валёк", "date": "2026-02-13", "goals": 0, "assists": 1, "matchId": "m50"}, {"id": "e302", "player": "Валёк", "date": "2026-02-20", "goals": 0, "assists": 2, "matchId": "m53"}, {"id": "e303", "player": "Валёк", "date": "2026-02-20", "goals": 0, "assists": 4, "matchId": "m53"}, {"id": "e304", "player": "Валёк", "date": "2026-02-20", "goals": 0, "assists": 6, "matchId": "m53"}, {"id": "e305", "player": "Валёк", "date": "2026-03-13", "goals": 0, "assists": 1, "matchId": "m283"}, {"id": "e306", "player": "Валёк", "date": "2026-03-14", "goals": 1, "assists": 0, "matchId": "m59"}, {"id": "e307", "player": "Валёк", "date": "2026-03-21", "goals": 1, "assists": 2, "matchId": "m60"}, {"id": "e308", "player": "Валёк", "date": "2026-04-04", "goals": 0, "assists": 4, "matchId": "m284"}, {"id": "e309", "player": "Валёк", "date": "2026-04-11", "goals": 1, "assists": 2, "matchId": "m66"}, {"id": "e310", "player": "Валёк", "date": "2026-04-25", "goals": 0, "assists": 2, "matchId": "m68"}, {"id": "e311", "player": "Валёк", "date": "2026-05-14", "goals": 0, "assists": 2, "matchId": "m285"}, {"id": "e312", "player": "Валёк", "date": "2026-05-21", "goals": 0, "assists": 2, "matchId": "m286"}, {"id": "e313", "player": "Валёк", "date": "2026-05-23", "goals": 2, "assists": 1, "matchId": "m77"}, {"id": "e314", "player": "Валёк", "date": "2024-09-14", "goals": 0, "assists": 1, "matchId": "m80"}, {"id": "e315", "player": "Валёк", "date": "2024-09-18", "goals": 1, "assists": 4, "matchId": "m81"}, {"id": "e316", "player": "Валёк", "date": "2024-09-21", "goals": 0, "assists": 0, "matchId": "m287"}, {"id": "e317", "player": "Валёк", "date": "2024-09-22", "goals": 0, "assists": 2, "matchId": "m83"}, {"id": "e318", "player": "Валёк", "date": "2024-09-25", "goals": 0, "assists": 4, "matchId": "m84"}, {"id": "e319", "player": "Валёк", "date": "2024-09-28", "goals": 0, "assists": 1, "matchId": "m86"}, {"id": "e320", "player": "Валёк", "date": "2024-10-04", "goals": 2, "assists": 4, "matchId": "m87"}, {"id": "e321", "player": "Валёк", "date": "2024-10-05", "goals": 0, "assists": 3, "matchId": "m88"}, {"id": "e322", "player": "Валёк", "date": "2024-10-11", "goals": 0, "assists": 0, "matchId": "m89"}, {"id": "e323", "player": "Валёк", "date": "2024-10-16", "goals": 0, "assists": 3, "matchId": "m92"}, {"id": "e324", "player": "Валёк", "date": "2024-10-19", "goals": 1, "assists": 4, "matchId": "m94"}, {"id": "e325", "player": "Валёк", "date": "2024-10-26", "goals": 0, "assists": 0, "matchId": "m96"}, {"id": "e326", "player": "Валёк", "date": "2024-10-26", "goals": 1, "assists": 2, "matchId": "m97"}, {"id": "e327", "player": "Валёк", "date": "2024-11-18", "goals": 0, "assists": 1, "matchId": "m288"}, {"id": "e328", "player": "Валёк", "date": "2024-11-23", "goals": 0, "assists": 0, "matchId": "m104"}, {"id": "e329", "player": "Валёк", "date": "2024-11-30", "goals": 1, "assists": 1, "matchId": "m106"}, {"id": "e330", "player": "Валёк", "date": "2024-12-07", "goals": 0, "assists": 1, "matchId": "m289"}, {"id": "e331", "player": "Валёк", "date": "2024-12-14", "goals": 0, "assists": 2, "matchId": "m109"}, {"id": "e332", "player": "Валёк", "date": "2024-12-21", "goals": 1, "assists": 3, "matchId": "m112"}, {"id": "e333", "player": "Валёк", "date": "2024-12-28", "goals": 0, "assists": 5, "matchId": "m113"}, {"id": "e334", "player": "Валёк", "date": "2025-01-11", "goals": 0, "assists": 6, "matchId": "m114"}, {"id": "e335", "player": "Валёк", "date": "2025-01-18", "goals": 0, "assists": 0, "matchId": "m116"}, {"id": "e336", "player": "Валёк", "date": "2025-01-25", "goals": 0, "assists": 0, "matchId": "m118"}, {"id": "e337", "player": "Валёк", "date": "2025-01-26", "goals": 0, "assists": 1, "matchId": "m119"}, {"id": "e338", "player": "Валёк", "date": "2025-02-01", "goals": 1, "assists": 1, "matchId": "m121"}, {"id": "e339", "player": "Валёк", "date": "2025-02-08", "goals": 1, "assists": 0, "matchId": "m124"}, {"id": "e340", "player": "Валёк", "date": "2025-02-14", "goals": 1, "assists": 2, "matchId": "m126"}, {"id": "e341", "player": "Валёк", "date": "2025-02-15", "goals": 0, "assists": 0, "matchId": "m290"}, {"id": "e342", "player": "Валёк", "date": "2025-02-15", "goals": 0, "assists": 1, "matchId": "m128"}, {"id": "e343", "player": "Валёк", "date": "2025-02-16", "goals": 0, "assists": 0, "matchId": "m291"}, {"id": "e344", "player": "Валёк", "date": "2025-03-02", "goals": 0, "assists": 0, "matchId": "m131"}, {"id": "e345", "player": "Валёк", "date": "2025-03-05", "goals": 2, "assists": 2, "matchId": "m292"}, {"id": "e346", "player": "Валёк", "date": "2025-03-13", "goals": 0, "assists": 0, "matchId": "m133"}, {"id": "e347", "player": "Валёк", "date": "2025-03-15", "goals": 1, "assists": 2, "matchId": "m134"}, {"id": "e348", "player": "Валёк", "date": "2025-03-16", "goals": 1, "assists": 1, "matchId": "m135"}, {"id": "e349", "player": "Валёк", "date": "2025-03-22", "goals": 0, "assists": 1, "matchId": "m136"}, {"id": "e350", "player": "Валёк", "date": "2025-03-29", "goals": 0, "assists": 1, "matchId": "m137"}, {"id": "e351", "player": "Валёк", "date": "2025-04-06", "goals": 0, "assists": 0, "matchId": "m139"}, {"id": "e352", "player": "Валёк", "date": "2025-04-19", "goals": 1, "assists": 1, "matchId": "m140"}, {"id": "e353", "player": "Валёк", "date": "2025-05-03", "goals": 1, "assists": 2, "matchId": "m142"}, {"id": "e354", "player": "Валёк", "date": "2025-05-04", "goals": 0, "assists": 1, "matchId": "m143"}, {"id": "e355", "player": "Валёк", "date": "2025-05-08", "goals": 0, "assists": 1, "matchId": "m144"}, {"id": "e356", "player": "Валёк", "date": "2025-05-10", "goals": 0, "assists": 1, "matchId": "m145"}, {"id": "e357", "player": "Валёк", "date": "2025-05-17", "goals": 0, "assists": 0, "matchId": "m146"}, {"id": "e358", "player": "Валёк", "date": "2025-05-17", "goals": 0, "assists": 0, "matchId": "m146"}, {"id": "e359", "player": "Валёк", "date": "2025-05-24", "goals": 0, "assists": 0, "matchId": "m149"}, {"id": "e360", "player": "Валёк", "date": "2023-09-30", "goals": 0, "assists": 0, "matchId": "m153"}, {"id": "e361", "player": "Валёк", "date": "2023-10-07", "goals": 0, "assists": 3, "matchId": "m154"}, {"id": "e362", "player": "Валёк", "date": "2023-10-14", "goals": 0, "assists": 3, "matchId": "m157"}, {"id": "e363", "player": "Валёк", "date": "2023-10-21", "goals": 0, "assists": 4, "matchId": "m293"}, {"id": "e364", "player": "Валёк", "date": "2023-11-04", "goals": 0, "assists": 1, "matchId": "m160"}, {"id": "e365", "player": "Валёк", "date": "2023-11-11", "goals": 1, "assists": 2, "matchId": "m163"}, {"id": "e366", "player": "Валёк", "date": "2023-11-12", "goals": 0, "assists": 0, "matchId": "m164"}, {"id": "e367", "player": "Валёк", "date": "2023-11-18", "goals": 0, "assists": 2, "matchId": "m294"}, {"id": "e368", "player": "Валёк", "date": "2023-11-25", "goals": 0, "assists": 5, "matchId": "m166"}, {"id": "e369", "player": "Валёк", "date": "2023-12-02", "goals": 0, "assists": 1, "matchId": "m167"}, {"id": "e370", "player": "Валёк", "date": "2023-12-03", "goals": 0, "assists": 0, "matchId": "m295"}, {"id": "e371", "player": "Валёк", "date": "2023-12-16", "goals": 0, "assists": 2, "matchId": "m172"}, {"id": "e372", "player": "Валёк", "date": "2023-12-23", "goals": 0, "assists": 2, "matchId": "m174"}, {"id": "e373", "player": "Валёк", "date": "2023-12-24", "goals": 0, "assists": 2, "matchId": "m296"}, {"id": "e374", "player": "Валёк", "date": "2023-12-30", "goals": 0, "assists": 1, "matchId": "m175"}, {"id": "e375", "player": "Валёк", "date": "2024-01-13", "goals": 1, "assists": 3, "matchId": "m176"}, {"id": "e376", "player": "Валёк", "date": "2024-01-20", "goals": 0, "assists": 2, "matchId": "m297"}, {"id": "e377", "player": "Валёк", "date": "2024-01-27", "goals": 1, "assists": 1, "matchId": "m178"}, {"id": "e378", "player": "Валёк", "date": "2024-01-28", "goals": 0, "assists": 0, "matchId": "m180"}, {"id": "e379", "player": "Валёк", "date": "2024-02-03", "goals": 0, "assists": 0, "matchId": "m181"}, {"id": "e380", "player": "Валёк", "date": "2024-02-10", "goals": 0, "assists": 1, "matchId": "m182"}, {"id": "e381", "player": "Валёк", "date": "2024-02-11", "goals": 1, "assists": 1, "matchId": "m183"}, {"id": "e382", "player": "Валёк", "date": "2024-02-11", "goals": 0, "assists": 1, "matchId": "m184"}, {"id": "e383", "player": "Валёк", "date": "2024-02-17", "goals": 1, "assists": 1, "matchId": "m185"}, {"id": "e384", "player": "Валёк", "date": "2024-02-24", "goals": 1, "assists": 1, "matchId": "m186"}, {"id": "e385", "player": "Валёк", "date": "2024-03-01", "goals": 1, "assists": 1, "matchId": "m298"}, {"id": "e386", "player": "Валёк", "date": "2024-03-02", "goals": 0, "assists": 1, "matchId": "m187"}, {"id": "e387", "player": "Валёк", "date": "2024-03-09", "goals": 0, "assists": 0, "matchId": "m188"}, {"id": "e388", "player": "Валёк", "date": "2024-03-15", "goals": 0, "assists": 3, "matchId": "m189"}, {"id": "e389", "player": "Валёк", "date": "2024-03-16", "goals": 0, "assists": 0, "matchId": "m190"}, {"id": "e390", "player": "Валёк", "date": "2024-03-17", "goals": 0, "assists": 3, "matchId": "m299"}, {"id": "e391", "player": "Валёк", "date": "2024-03-22", "goals": 0, "assists": 2, "matchId": "m300"}, {"id": "e392", "player": "Валёк", "date": "2024-03-29", "goals": 0, "assists": 1, "matchId": "m192"}, {"id": "e393", "player": "Валёк", "date": "2024-03-30", "goals": 0, "assists": 4, "matchId": "m193"}, {"id": "e394", "player": "Валёк", "date": "2024-04-05", "goals": 2, "assists": 0, "matchId": "m194"}, {"id": "e395", "player": "Валёк", "date": "2024-04-06", "goals": 0, "assists": 1, "matchId": "m195"}, {"id": "e396", "player": "Валёк", "date": "2024-04-12", "goals": 0, "assists": 4, "matchId": "m196"}, {"id": "e397", "player": "Валёк", "date": "2024-04-14", "goals": 0, "assists": 1, "matchId": "m198"}, {"id": "e398", "player": "Валёк", "date": "2024-04-27", "goals": 2, "assists": 1, "matchId": "m199"}, {"id": "e399", "player": "Валёк", "date": "2024-05-03", "goals": 0, "assists": 0, "matchId": "m202"}, {"id": "e400", "player": "Валёк", "date": "2024-05-11", "goals": 0, "assists": 0, "matchId": "m203"}, {"id": "e401", "player": "Валёк", "date": "2024-05-11", "goals": 0, "assists": 1, "matchId": "m204"}, {"id": "e402", "player": "Валёк", "date": "2024-05-11", "goals": 0, "assists": 3, "matchId": "m205"}, {"id": "e403", "player": "Валёк", "date": "2024-05-12", "goals": 0, "assists": 2, "matchId": "m206"}, {"id": "e404", "player": "Валёк", "date": "2024-05-31", "goals": 2, "assists": 0, "matchId": "m210"}, {"id": "e405", "player": "Валёк", "date": "2022-09-03", "goals": 0, "assists": 0, "matchId": "m211"}, {"id": "e406", "player": "Валёк", "date": "2022-09-10", "goals": 1, "assists": 1, "matchId": "m213"}, {"id": "e407", "player": "Валёк", "date": "2022-09-11", "goals": 0, "assists": 2, "matchId": "m214"}, {"id": "e408", "player": "Валёк", "date": "2022-09-24", "goals": 0, "assists": 1, "matchId": "m215"}, {"id": "e409", "player": "Валёк", "date": "2022-10-01", "goals": 0, "assists": 1, "matchId": "m216"}, {"id": "e410", "player": "Валёк", "date": "2022-10-08", "goals": 0, "assists": 3, "matchId": "m218"}, {"id": "e411", "player": "Валёк", "date": "2022-10-15", "goals": 0, "assists": 1, "matchId": "m301"}, {"id": "e412", "player": "Валёк", "date": "2022-10-22", "goals": 0, "assists": 2, "matchId": "m220"}, {"id": "e413", "player": "Валёк", "date": "2022-10-23", "goals": 0, "assists": 2, "matchId": "m221"}, {"id": "e414", "player": "Валёк", "date": "2022-10-29", "goals": 0, "assists": 2, "matchId": "m222"}, {"id": "e415", "player": "Валёк", "date": "2022-11-05", "goals": 0, "assists": 1, "matchId": "m223"}, {"id": "e416", "player": "Валёк", "date": "2022-11-12", "goals": 1, "assists": 2, "matchId": "m224"}, {"id": "e417", "player": "Валёк", "date": "2022-11-19", "goals": 2, "assists": 1, "matchId": "m226"}, {"id": "e418", "player": "Валёк", "date": "2022-11-20", "goals": 0, "assists": 0, "matchId": "m227"}, {"id": "e419", "player": "Валёк", "date": "2022-11-26", "goals": 0, "assists": 2, "matchId": "m228"}, {"id": "e420", "player": "Валёк", "date": "2022-12-03", "goals": 0, "assists": 0, "matchId": "m229"}, {"id": "e421", "player": "Валёк", "date": "2022-12-04", "goals": 0, "assists": 2, "matchId": "m230"}, {"id": "e422", "player": "Валёк", "date": "2022-12-10", "goals": 0, "assists": 4, "matchId": "m232"}, {"id": "e423", "player": "Валёк", "date": "2022-12-17", "goals": 0, "assists": 1, "matchId": "m233"}, {"id": "e424", "player": "Валёк", "date": "2022-12-20", "goals": 0, "assists": 4, "matchId": "m234"}, {"id": "e425", "player": "Валёк", "date": "2022-12-24", "goals": 0, "assists": 3, "matchId": "m235"}, {"id": "e426", "player": "Валёк", "date": "2022-12-27", "goals": 0, "assists": 2, "matchId": "m236"}, {"id": "e427", "player": "Валёк", "date": "2023-01-07", "goals": 1, "assists": 2, "matchId": "m238"}, {"id": "e428", "player": "Валёк", "date": "2023-01-14", "goals": 1, "assists": 1, "matchId": "m240"}, {"id": "e429", "player": "Валёк", "date": "2023-01-21", "goals": 1, "assists": 1, "matchId": "m241"}, {"id": "e430", "player": "Валёк", "date": "2023-02-04", "goals": 0, "assists": 1, "matchId": "m245"}, {"id": "e431", "player": "Валёк", "date": "2023-02-04", "goals": 3, "assists": 2, "matchId": "m246"}, {"id": "e432", "player": "Валёк", "date": "2023-02-05", "goals": 0, "assists": 1, "matchId": "m247"}, {"id": "e433", "player": "Валёк", "date": "2023-02-05", "goals": 0, "assists": 1, "matchId": "m248"}, {"id": "e434", "player": "Валёк", "date": "2023-02-18", "goals": 0, "assists": 4, "matchId": "m250"}, {"id": "e435", "player": "Валёк", "date": "2023-02-25", "goals": 0, "assists": 0, "matchId": "m302"}, {"id": "e436", "player": "Валёк", "date": "2023-02-26", "goals": 0, "assists": 0, "matchId": "m251"}, {"id": "e437", "player": "Валёк", "date": "2023-03-04", "goals": 0, "assists": 2, "matchId": "m252"}, {"id": "e438", "player": "Валёк", "date": "2023-03-11", "goals": 0, "assists": 1, "matchId": "m254"}, {"id": "e439", "player": "Валёк", "date": "2023-03-18", "goals": 0, "assists": 0, "matchId": "m255"}, {"id": "e440", "player": "Валёк", "date": "2023-03-25", "goals": 0, "assists": 3, "matchId": "m257"}, {"id": "e441", "player": "Валёк", "date": "2023-04-01", "goals": 0, "assists": 1, "matchId": "m260"}, {"id": "e442", "player": "Валёк", "date": "2023-04-04", "goals": 1, "assists": 1, "matchId": "m262"}, {"id": "e443", "player": "Валёк", "date": "2023-04-08", "goals": 2, "assists": 2, "matchId": "m303"}, {"id": "e444", "player": "Валёк", "date": "2023-04-08", "goals": 1, "assists": 1, "matchId": "m304"}, {"id": "e445", "player": "Валёк", "date": "2023-04-15", "goals": 0, "assists": 0, "matchId": "m263"}, {"id": "e446", "player": "Валёк", "date": "2023-04-15", "goals": 0, "assists": 3, "matchId": "m264"}, {"id": "e447", "player": "Валёк", "date": "2023-04-15", "goals": 3, "assists": 2, "matchId": "m265"}, {"id": "e448", "player": "Валёк", "date": "2023-04-22", "goals": 0, "assists": 3, "matchId": "m267"}, {"id": "e449", "player": "Валёк", "date": "2023-04-23", "goals": 0, "assists": 3, "matchId": "m268"}, {"id": "e450", "player": "Валёк", "date": "2023-04-25", "goals": 0, "assists": 0, "matchId": "m269"}, {"id": "e451", "player": "Валёк", "date": "2023-04-29", "goals": 0, "assists": 4, "matchId": "m270"}, {"id": "e452", "player": "Валёк", "date": "2023-04-30", "goals": 0, "assists": 0, "matchId": "m271"}, {"id": "e453", "player": "Валёк", "date": "2023-05-02", "goals": 0, "assists": 2, "matchId": "m272"}, {"id": "e454", "player": "Валёк", "date": "2023-05-06", "goals": 0, "assists": 1, "matchId": "m273"}, {"id": "e455", "player": "Валёк", "date": "2023-05-16", "goals": 0, "assists": 1, "matchId": "m277"}, {"id": "e456", "player": "Валёк", "date": "2023-05-20", "goals": 0, "assists": 1, "matchId": "m278"}, {"id": "e457", "player": "Валёк", "date": "2023-05-27", "goals": 0, "assists": 0, "matchId": "m280"}, {"id": "e458", "player": "Валёк", "date": "2023-05-30", "goals": 0, "assists": 1, "matchId": "m281"}, {"id": "e459", "player": "Санёк", "date": "2024-09-14", "goals": 0, "assists": 2, "matchId": "m80"}, {"id": "e460", "player": "Санёк", "date": "2024-09-21", "goals": 0, "assists": 0, "matchId": "m287"}, {"id": "e461", "player": "Санёк", "date": "2024-09-22", "goals": 0, "assists": 0, "matchId": "m83"}, {"id": "e462", "player": "Санёк", "date": "2024-09-27", "goals": 0, "assists": 4, "matchId": "m85"}, {"id": "e463", "player": "Санёк", "date": "2024-09-28", "goals": 0, "assists": 2, "matchId": "m86"}, {"id": "e464", "player": "Санёк", "date": "2024-10-04", "goals": 1, "assists": 2, "matchId": "m87"}, {"id": "e465", "player": "Санёк", "date": "2024-10-05", "goals": 0, "assists": 2, "matchId": "m88"}, {"id": "e466", "player": "Санёк", "date": "2024-10-11", "goals": 1, "assists": 2, "matchId": "m89"}, {"id": "e467", "player": "Санёк", "date": "2024-10-12", "goals": 3, "assists": 2, "matchId": "m90"}, {"id": "e468", "player": "Санёк", "date": "2024-10-13", "goals": 0, "assists": 1, "matchId": "m91"}, {"id": "e469", "player": "Санёк", "date": "2024-10-14", "goals": 1, "assists": 1, "matchId": "m305"}, {"id": "e470", "player": "Санёк", "date": "2024-10-16", "goals": 0, "assists": 2, "matchId": "m92"}, {"id": "e471", "player": "Санёк", "date": "2024-10-18", "goals": 0, "assists": 2, "matchId": "m93"}, {"id": "e472", "player": "Санёк", "date": "2024-10-19", "goals": 0, "assists": 0, "matchId": "m306"}, {"id": "e473", "player": "Санёк", "date": "2024-10-26", "goals": 0, "assists": 0, "matchId": "m96"}, {"id": "e474", "player": "Санёк", "date": "2024-10-26", "goals": 0, "assists": 0, "matchId": "m97"}, {"id": "e475", "player": "Санёк", "date": "2024-10-30", "goals": 0, "assists": 0, "matchId": "m98"}, {"id": "e476", "player": "Санёк", "date": "2024-11-01", "goals": 1, "assists": 0, "matchId": "m99"}, {"id": "e477", "player": "Санёк", "date": "2024-11-02", "goals": 1, "assists": 0, "matchId": "m100"}, {"id": "e478", "player": "Санёк", "date": "2024-11-09", "goals": 1, "assists": 0, "matchId": "m101"}, {"id": "e479", "player": "Санёк", "date": "2024-11-10", "goals": 0, "assists": 0, "matchId": "m307"}, {"id": "e480", "player": "Санёк", "date": "2024-11-13", "goals": 0, "assists": 0, "matchId": "m308"}, {"id": "e481", "player": "Санёк", "date": "2024-11-16", "goals": 0, "assists": 0, "matchId": "m102"}, {"id": "e482", "player": "Санёк", "date": "2024-11-17", "goals": 0, "assists": 0, "matchId": "m103"}, {"id": "e483", "player": "Санёк", "date": "2024-11-23", "goals": 0, "assists": 0, "matchId": "m104"}, {"id": "e484", "player": "Санёк", "date": "2024-11-30", "goals": 0, "assists": 0, "matchId": "m106"}, {"id": "e485", "player": "Санёк", "date": "2024-12-01", "goals": 0, "assists": 0, "matchId": "m107"}, {"id": "e486", "player": "Санёк", "date": "2024-12-07", "goals": 0, "assists": 0, "matchId": "m289"}, {"id": "e487", "player": "Санёк", "date": "2024-12-08", "goals": 0, "assists": 0, "matchId": "m309"}, {"id": "e488", "player": "Санёк", "date": "2024-12-13", "goals": 0, "assists": 0, "matchId": "m108"}, {"id": "e489", "player": "Санёк", "date": "2024-12-14", "goals": 0, "assists": 0, "matchId": "m109"}, {"id": "e490", "player": "Санёк", "date": "2024-12-18", "goals": 0, "assists": 0, "matchId": "m110"}, {"id": "e491", "player": "Санёк", "date": "2024-12-20", "goals": 0, "assists": 0, "matchId": "m111"}, {"id": "e492", "player": "Санёк", "date": "2024-12-28", "goals": 0, "assists": 0, "matchId": "m113"}, {"id": "e493", "player": "Санёк", "date": "2025-01-11", "goals": 0, "assists": 0, "matchId": "m114"}, {"id": "e494", "player": "Санёк", "date": "2023-09-29", "goals": 0, "assists": 1, "matchId": "m310"}, {"id": "e495", "player": "Санёк", "date": "2023-09-30", "goals": 1, "assists": 0, "matchId": "m153"}, {"id": "e496", "player": "Санёк", "date": "2023-10-07", "goals": 0, "assists": 1, "matchId": "m154"}, {"id": "e497", "player": "Санёк", "date": "2023-10-08", "goals": 0, "assists": 1, "matchId": "m155"}, {"id": "e498", "player": "Санёк", "date": "2023-10-14", "goals": 0, "assists": 1, "matchId": "m157"}, {"id": "e499", "player": "Санёк", "date": "2023-10-15", "goals": 0, "assists": 1, "matchId": "m311"}, {"id": "e500", "player": "Санёк", "date": "2023-10-28", "goals": 2, "assists": 3, "matchId": "m158"}, {"id": "e501", "player": "Санёк", "date": "2023-11-04", "goals": 0, "assists": 1, "matchId": "m160"}, {"id": "e502", "player": "Санёк", "date": "2023-11-05", "goals": 1, "assists": 1, "matchId": "m312"}, {"id": "e503", "player": "Санёк", "date": "2023-11-07", "goals": 1, "assists": 1, "matchId": "m162"}, {"id": "e504", "player": "Санёк", "date": "2023-11-11", "goals": 1, "assists": 1, "matchId": "m163"}, {"id": "e505", "player": "Санёк", "date": "2023-11-12", "goals": 0, "assists": 0, "matchId": "m164"}, {"id": "e506", "player": "Санёк", "date": "2023-11-14", "goals": 0, "assists": 2, "matchId": "m165"}, {"id": "e507", "player": "Санёк", "date": "2023-11-25", "goals": 4, "assists": 4, "matchId": "m166"}, {"id": "e508", "player": "Санёк", "date": "2023-12-02", "goals": 0, "assists": 0, "matchId": "m167"}, {"id": "e509", "player": "Санёк", "date": "2023-12-03", "goals": 0, "assists": 0, "matchId": "m295"}, {"id": "e510", "player": "Санёк", "date": "2023-12-09", "goals": 1, "assists": 0, "matchId": "m313"}, {"id": "e511", "player": "Санёк", "date": "2023-12-10", "goals": 3, "assists": 0, "matchId": "m314"}, {"id": "e512", "player": "Санёк", "date": "2023-12-10", "goals": 0, "assists": 1, "matchId": "m170"}, {"id": "e513", "player": "Санёк", "date": "2023-12-13", "goals": 0, "assists": 2, "matchId": "m315"}, {"id": "e514", "player": "Санёк", "date": "2023-12-16", "goals": 1, "assists": 3, "matchId": "m172"}, {"id": "e515", "player": "Санёк", "date": "2023-12-17", "goals": 1, "assists": 3, "matchId": "m173"}, {"id": "e516", "player": "Санёк", "date": "2023-12-23", "goals": 2, "assists": 2, "matchId": "m174"}, {"id": "e517", "player": "Санёк", "date": "2023-12-24", "goals": 1, "assists": 1, "matchId": "m296"}, {"id": "e518", "player": "Санёк", "date": "2023-12-30", "goals": 0, "assists": 4, "matchId": "m175"}, {"id": "e519", "player": "Санёк", "date": "2024-01-05", "goals": 0, "assists": 1, "matchId": "m316"}, {"id": "e520", "player": "Санёк", "date": "2024-01-05", "goals": 1, "assists": 3, "matchId": "m317"}, {"id": "e521", "player": "Санёк", "date": "2024-01-08", "goals": 2, "assists": 2, "matchId": "m318"}, {"id": "e522", "player": "Санёк", "date": "2024-01-13", "goals": 1, "assists": 3, "matchId": "m176"}, {"id": "e523", "player": "Санёк", "date": "2024-01-14", "goals": 0, "assists": 0, "matchId": "m319"}, {"id": "e524", "player": "Санёк", "date": "2024-01-20", "goals": 1, "assists": 0, "matchId": "m320"}, {"id": "e525", "player": "Санёк", "date": "2024-01-20", "goals": 0, "assists": 3, "matchId": "m297"}, {"id": "e526", "player": "Санёк", "date": "2024-01-27", "goals": 0, "assists": 1, "matchId": "m177"}, {"id": "e527", "player": "Санёк", "date": "2024-01-27", "goals": 0, "assists": 5, "matchId": "m178"}, {"id": "e528", "player": "Санёк", "date": "2024-01-28", "goals": 0, "assists": 0, "matchId": "m179"}, {"id": "e529", "player": "Санёк", "date": "2024-01-28", "goals": 0, "assists": 0, "matchId": "m180"}, {"id": "e530", "player": "Санёк", "date": "2024-02-09", "goals": 0, "assists": 1, "matchId": "m321"}, {"id": "e531", "player": "Санёк", "date": "2024-02-10", "goals": 3, "assists": 1, "matchId": "m182"}, {"id": "e532", "player": "Санёк", "date": "2024-02-11", "goals": 3, "assists": 0, "matchId": "m322"}, {"id": "e533", "player": "Санёк", "date": "2024-02-11", "goals": 0, "assists": 1, "matchId": "m184"}, {"id": "e534", "player": "Санёк", "date": "2024-02-16", "goals": 0, "assists": 0, "matchId": "m323"}, {"id": "e535", "player": "Санёк", "date": "2024-02-17", "goals": 3, "assists": 0, "matchId": "m185"}, {"id": "e536", "player": "Санёк", "date": "2024-02-26", "goals": 2, "assists": 1, "matchId": "m324"}, {"id": "e537", "player": "Санёк", "date": "2024-03-01", "goals": 1, "assists": 2, "matchId": "m298"}, {"id": "e538", "player": "Санёк", "date": "2024-03-02", "goals": 0, "assists": 1, "matchId": "m187"}, {"id": "e539", "player": "Санёк", "date": "2024-03-09", "goals": 0, "assists": 0, "matchId": "m188"}, {"id": "e540", "player": "Санёк", "date": "2024-03-14", "goals": 1, "assists": 1, "matchId": "m325"}, {"id": "e541", "player": "Санёк", "date": "2024-03-15", "goals": 2, "assists": 3, "matchId": "m189"}, {"id": "e542", "player": "Санёк", "date": "2024-03-16", "goals": 0, "assists": 1, "matchId": "m190"}, {"id": "e543", "player": "Санёк", "date": "2024-03-17", "goals": 1, "assists": 0, "matchId": "m299"}, {"id": "e544", "player": "Санёк", "date": "2024-03-22", "goals": 0, "assists": 1, "matchId": "m300"}, {"id": "e545", "player": "Санёк", "date": "2024-03-23", "goals": 1, "assists": 4, "matchId": "m191"}, {"id": "e546", "player": "Санёк", "date": "2024-03-29", "goals": 0, "assists": 1, "matchId": "m192"}, {"id": "e547", "player": "Санёк", "date": "2024-03-30", "goals": 0, "assists": 4, "matchId": "m193"}, {"id": "e548", "player": "Санёк", "date": "2024-04-03", "goals": 2, "assists": 1, "matchId": "m326"}, {"id": "e549", "player": "Санёк", "date": "2024-04-05", "goals": 0, "assists": 0, "matchId": "m194"}, {"id": "e550", "player": "Санёк", "date": "2024-04-06", "goals": 0, "assists": 1, "matchId": "m195"}, {"id": "e551", "player": "Санёк", "date": "2024-04-07", "goals": 1, "assists": 3, "matchId": "m327"}, {"id": "e552", "player": "Санёк", "date": "2024-04-12", "goals": 0, "assists": 0, "matchId": "m196"}, {"id": "e553", "player": "Санёк", "date": "2024-04-13", "goals": 0, "assists": 0, "matchId": "m197"}, {"id": "e554", "player": "Санёк", "date": "2024-04-14", "goals": 0, "assists": 1, "matchId": "m198"}, {"id": "e555", "player": "Санёк", "date": "2024-04-27", "goals": 2, "assists": 3, "matchId": "m199"}, {"id": "e556", "player": "Санёк", "date": "2024-04-30", "goals": 0, "assists": 4, "matchId": "m200"}, {"id": "e557", "player": "Санёк", "date": "2024-05-02", "goals": 0, "assists": 2, "matchId": "m201"}, {"id": "e558", "player": "Санёк", "date": "2024-05-03", "goals": 3, "assists": 2, "matchId": "m202"}, {"id": "e559", "player": "Санёк", "date": "2024-05-07", "goals": 1, "assists": 2, "matchId": "m328"}, {"id": "e560", "player": "Санёк", "date": "2024-05-11", "goals": 0, "assists": 0, "matchId": "m203"}, {"id": "e561", "player": "Санёк", "date": "2024-05-11", "goals": 0, "assists": 1, "matchId": "m204"}, {"id": "e562", "player": "Санёк", "date": "2024-05-11", "goals": 0, "assists": 5, "matchId": "m205"}, {"id": "e563", "player": "Санёк", "date": "2024-05-12", "goals": 0, "assists": 0, "matchId": "m206"}, {"id": "e564", "player": "Санёк", "date": "2024-05-12", "goals": 0, "assists": 6, "matchId": "m329"}, {"id": "e565", "player": "Санёк", "date": "2024-05-16", "goals": 1, "assists": 1, "matchId": "m330"}, {"id": "e566", "player": "Санёк", "date": "2024-05-18", "goals": 1, "assists": 4, "matchId": "m207"}, {"id": "e567", "player": "Санёк", "date": "2024-05-19", "goals": 1, "assists": 3, "matchId": "m208"}, {"id": "e568", "player": "Санёк", "date": "2024-05-23", "goals": 1, "assists": 1, "matchId": "m331"}, {"id": "e569", "player": "Санёк", "date": "2024-05-25", "goals": 3, "assists": 4, "matchId": "m209"}, {"id": "e570", "player": "Санёк", "date": "2024-05-26", "goals": 0, "assists": 2, "matchId": "m332"}, {"id": "e571", "player": "Санёк", "date": "2024-05-28", "goals": 2, "assists": 0, "matchId": "m333"}, {"id": "e572", "player": "Санёк", "date": "2024-05-31", "goals": 0, "assists": 0, "matchId": "m210"}, {"id": "e573", "player": "Санёк", "date": "2022-09-03", "goals": 1, "assists": 3, "matchId": "m211"}, {"id": "e574", "player": "Санёк", "date": "2022-09-04", "goals": 0, "assists": 3, "matchId": "m212"}, {"id": "e575", "player": "Санёк", "date": "2022-09-10", "goals": 0, "assists": 1, "matchId": "m213"}, {"id": "e576", "player": "Санёк", "date": "2022-09-11", "goals": 0, "assists": 2, "matchId": "m214"}, {"id": "e577", "player": "Санёк", "date": "2022-09-24", "goals": 0, "assists": 2, "matchId": "m215"}, {"id": "e578", "player": "Санёк", "date": "2022-10-02", "goals": 0, "assists": 1, "matchId": "m217"}, {"id": "e579", "player": "Санёк", "date": "2022-10-08", "goals": 2, "assists": 3, "matchId": "m218"}, {"id": "e580", "player": "Санёк", "date": "2022-10-13", "goals": 0, "assists": 2, "matchId": "m334"}, {"id": "e581", "player": "Санёк", "date": "2022-10-15", "goals": 1, "assists": 0, "matchId": "m301"}, {"id": "e582", "player": "Санёк", "date": "2022-10-16", "goals": 1, "assists": 1, "matchId": "m335"}, {"id": "e583", "player": "Санёк", "date": "2022-10-18", "goals": 1, "assists": 2, "matchId": "m336"}, {"id": "e584", "player": "Санёк", "date": "2022-10-23", "goals": 0, "assists": 1, "matchId": "m221"}, {"id": "e585", "player": "Санёк", "date": "2022-10-27", "goals": 2, "assists": 2, "matchId": "m337"}, {"id": "e586", "player": "Санёк", "date": "2022-10-29", "goals": 0, "assists": 2, "matchId": "m222"}, {"id": "e587", "player": "Санёк", "date": "2022-11-05", "goals": 0, "assists": 3, "matchId": "m223"}, {"id": "e588", "player": "Санёк", "date": "2022-11-12", "goals": 1, "assists": 0, "matchId": "m224"}, {"id": "e589", "player": "Санёк", "date": "2022-11-19", "goals": 1, "assists": 1, "matchId": "m226"}, {"id": "e590", "player": "Санёк", "date": "2022-11-20", "goals": 1, "assists": 1, "matchId": "m227"}, {"id": "e591", "player": "Санёк", "date": "2022-11-26", "goals": 0, "assists": 0, "matchId": "m228"}, {"id": "e592", "player": "Санёк", "date": "2022-12-03", "goals": 2, "assists": 2, "matchId": "m229"}, {"id": "e593", "player": "Санёк", "date": "2022-12-04", "goals": 0, "assists": 2, "matchId": "m230"}, {"id": "e594", "player": "Санёк", "date": "2022-12-04", "goals": 0, "assists": 0, "matchId": "m231"}, {"id": "e595", "player": "Санёк", "date": "2022-12-10", "goals": 2, "assists": 3, "matchId": "m232"}, {"id": "e596", "player": "Санёк", "date": "2022-12-17", "goals": 0, "assists": 0, "matchId": "m233"}, {"id": "e597", "player": "Санёк", "date": "2022-12-20", "goals": 4, "assists": 4, "matchId": "m234"}, {"id": "e598", "player": "Санёк", "date": "2022-12-24", "goals": 0, "assists": 1, "matchId": "m235"}, {"id": "e599", "player": "Санёк", "date": "2022-12-25", "goals": 0, "assists": 0, "matchId": "m338"}, {"id": "e600", "player": "Санёк", "date": "2022-12-27", "goals": 0, "assists": 2, "matchId": "m236"}, {"id": "e601", "player": "Санёк", "date": "2023-01-05", "goals": 1, "assists": 1, "matchId": "m237"}, {"id": "e602", "player": "Санёк", "date": "2023-01-07", "goals": 0, "assists": 1, "matchId": "m238"}, {"id": "e603", "player": "Санёк", "date": "2023-01-14", "goals": 0, "assists": 1, "matchId": "m240"}, {"id": "e604", "player": "Санёк", "date": "2023-01-14", "goals": 0, "assists": 0, "matchId": "m240"}, {"id": "e605", "player": "Санёк", "date": "2023-01-21", "goals": 2, "assists": 1, "matchId": "m241"}, {"id": "e606", "player": "Санёк", "date": "2023-01-22", "goals": 0, "assists": 1, "matchId": "m242"}, {"id": "e607", "player": "Санёк", "date": "2023-01-28", "goals": 1, "assists": 1, "matchId": "m243"}, {"id": "e608", "player": "Санёк", "date": "2023-01-28", "goals": 0, "assists": 3, "matchId": "m243"}, {"id": "e609", "player": "Санёк", "date": "2023-01-29", "goals": 1, "assists": 1, "matchId": "m244"}, {"id": "e610", "player": "Санёк", "date": "2023-02-04", "goals": 1, "assists": 1, "matchId": "m245"}, {"id": "e611", "player": "Санёк", "date": "2023-02-05", "goals": 0, "assists": 2, "matchId": "m247"}, {"id": "e612", "player": "Санёк", "date": "2023-02-05", "goals": 0, "assists": 2, "matchId": "m248"}, {"id": "e613", "player": "Санёк", "date": "2023-02-12", "goals": 1, "assists": 0, "matchId": "m339"}, {"id": "e614", "player": "Санёк", "date": "2023-02-14", "goals": 0, "assists": 0, "matchId": "m249"}, {"id": "e615", "player": "Санёк", "date": "2023-02-18", "goals": 3, "assists": 1, "matchId": "m250"}, {"id": "e616", "player": "Санёк", "date": "2023-02-25", "goals": 0, "assists": 0, "matchId": "m302"}, {"id": "e617", "player": "Санёк", "date": "2023-02-26", "goals": 0, "assists": 0, "matchId": "m251"}, {"id": "e618", "player": "Санёк", "date": "2023-03-04", "goals": 2, "assists": 0, "matchId": "m252"}, {"id": "e619", "player": "Санёк", "date": "2023-03-11", "goals": 0, "assists": 0, "matchId": "m254"}, {"id": "e620", "player": "Санёк", "date": "2023-03-16", "goals": 4, "assists": 1, "matchId": "m340"}, {"id": "e621", "player": "Санёк", "date": "2023-03-18", "goals": 0, "assists": 1, "matchId": "m255"}, {"id": "e622", "player": "Санёк", "date": "2023-03-19", "goals": 0, "assists": 4, "matchId": "m256"}, {"id": "e623", "player": "Санёк", "date": "2023-03-25", "goals": 2, "assists": 2, "matchId": "m257"}, {"id": "e624", "player": "Санёк", "date": "2023-03-26", "goals": 0, "assists": 2, "matchId": "m341"}, {"id": "e625", "player": "Санёк", "date": "2023-03-26", "goals": 0, "assists": 2, "matchId": "m258"}, {"id": "e626", "player": "Санёк", "date": "2023-03-28", "goals": 0, "assists": 1, "matchId": "m259"}, {"id": "e627", "player": "Санёк", "date": "2023-04-02", "goals": 2, "assists": 1, "matchId": "m261"}, {"id": "e628", "player": "Санёк", "date": "2023-04-04", "goals": 0, "assists": 2, "matchId": "m262"}, {"id": "e629", "player": "Санёк", "date": "2023-04-08", "goals": 2, "assists": 4, "matchId": "m303"}, {"id": "e630", "player": "Санёк", "date": "2023-04-08", "goals": 0, "assists": 1, "matchId": "m304"}, {"id": "e631", "player": "Санёк", "date": "2023-04-15", "goals": 0, "assists": 0, "matchId": "m263"}, {"id": "e632", "player": "Санёк", "date": "2023-04-15", "goals": 2, "assists": 3, "matchId": "m264"}, {"id": "e633", "player": "Санёк", "date": "2023-04-15", "goals": 2, "assists": 3, "matchId": "m265"}, {"id": "e634", "player": "Санёк", "date": "2023-04-22", "goals": 1, "assists": 3, "matchId": "m267"}, {"id": "e635", "player": "Санёк", "date": "2023-04-23", "goals": 0, "assists": 2, "matchId": "m268"}, {"id": "e636", "player": "Санёк", "date": "2023-04-25", "goals": 0, "assists": 0, "matchId": "m269"}, {"id": "e637", "player": "Санёк", "date": "2023-04-29", "goals": 0, "assists": 0, "matchId": "m270"}, {"id": "e638", "player": "Санёк", "date": "2023-04-30", "goals": 2, "assists": 1, "matchId": "m271"}, {"id": "e639", "player": "Санёк", "date": "2023-05-02", "goals": 0, "assists": 0, "matchId": "m272"}, {"id": "e640", "player": "Санёк", "date": "2023-05-06", "goals": 1, "assists": 3, "matchId": "m273"}, {"id": "e641", "player": "Санёк", "date": "2023-05-07", "goals": 1, "assists": 2, "matchId": "m274"}, {"id": "e642", "player": "Санёк", "date": "2023-05-13", "goals": 2, "assists": 4, "matchId": "m275"}, {"id": "e643", "player": "Санёк", "date": "2023-05-14", "goals": 0, "assists": 0, "matchId": "m276"}, {"id": "e644", "player": "Санёк", "date": "2023-05-16", "goals": 0, "assists": 1, "matchId": "m277"}, {"id": "e645", "player": "Санёк", "date": "2023-05-20", "goals": 0, "assists": 1, "matchId": "m342"}, {"id": "e646", "player": "Санёк", "date": "2023-05-20", "goals": 1, "assists": 0, "matchId": "m342"}, {"id": "e647", "player": "Санёк", "date": "2023-05-20", "goals": 0, "assists": 2, "matchId": "m278"}, {"id": "e648", "player": "Санёк", "date": "2023-05-21", "goals": 0, "assists": 0, "matchId": "m343"}, {"id": "e649", "player": "Санёк", "date": "2023-05-23", "goals": 1, "assists": 1, "matchId": "m279"}, {"id": "e650", "player": "Санёк", "date": "2023-05-27", "goals": 1, "assists": 1, "matchId": "m280"}, {"id": "e651", "player": "Санёк", "date": "2023-05-30", "goals": 2, "assists": 2, "matchId": "m281"}, {"id": "e652", "player": "Санёк М.", "date": "2024-03-09", "goals": 2, "assists": 0, "matchId": "m188"}, {"id": "e653", "player": "Санёк М.", "date": "2024-03-16", "goals": 1, "assists": 2, "matchId": "m190"}, {"id": "e654", "player": "Санёк М.", "date": "2024-03-30", "goals": 0, "assists": 0, "matchId": "m193"}, {"id": "e655", "player": "Санёк М.", "date": "2024-05-03", "goals": 1, "assists": 0, "matchId": "m202"}];

function seasonLabel(iso) {
  const [y, m] = iso.split('-').map(Number);
  const startYear = m >= 9 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

// A season "2025-26" runs 2025-09-01..2026-08-31; it only counts as finished once
// the next season has actually begun (1 September of the following year).
function isSeasonComplete(season) {
  const startYear = Number(season.split('-')[0]);
  const nextSeasonStart = new Date(`${startYear + 1}-09-01T00:00:00`);
  return new Date() >= nextSeasonStart;
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function computeStats(entries, players) {
  const byPlayer = {};
  players.forEach((p) => {
    byPlayer[p] = { player: p, goals: 0, assists: 0, points: 0, gp: 0, hatTricks: 0, pokerGames: 0, pentaTricks: 0, goalMadness: 0, multiPointGames: 0, bestGame: null, entries: [] };
  });
  entries.forEach((e) => {
    if (!byPlayer[e.player]) {
      byPlayer[e.player] = { player: e.player, goals: 0, assists: 0, points: 0, gp: 0, hatTricks: 0, pokerGames: 0, pentaTricks: 0, goalMadness: 0, multiPointGames: 0, bestGame: null, entries: [] };
    }
    const p = byPlayer[e.player];
    const pts = e.goals + e.assists;
    p.goals += e.goals;
    p.assists += e.assists;
    p.points += pts;
    p.gp += 1;
    if (e.goals >= 3) p.hatTricks += 1;
    if (e.goals >= 4) p.pokerGames += 1;
    if (e.goals >= 5) p.pentaTricks += 1;
    if (e.goals >= 6) p.goalMadness += 1;
    if (pts >= 2) p.multiPointGames += 1;
    if (!p.bestGame || pts > p.bestGame.points) p.bestGame = { ...e, points: pts };
    p.entries.push({ ...e, points: pts });
  });
  Object.values(byPlayer).forEach((p) => {
    p.entries.sort((a, b) => a.date.localeCompare(b.date));
    let cur = 0;
    let longest = 0;
    p.entries.forEach((e) => {
      if (e.points > 0) {
        cur += 1;
        longest = Math.max(longest, cur);
      } else {
        cur = 0;
      }
    });
    p.currentStreak = cur;
    p.longestStreak = longest;
    p.ppg = p.gp ? p.points / p.gp : 0;
  });
  const leaderboard = Object.values(byPlayer).sort((a, b) => b.points - a.points || b.goals - a.goals);
  return { byPlayer, leaderboard };
}

function buildCumulativeSeries(entries, players, season) {
  const filtered = entries.filter((e) => seasonLabel(e.date) === season);
  const byPlayer = {};
  players.forEach((p) => {
    byPlayer[p] = filtered.filter((e) => e.player === p).sort((a, b) => a.date.localeCompare(b.date));
  });
  const maxLen = Math.max(0, ...players.map((p) => byPlayer[p].length));
  const data = [];
  for (let i = 0; i < maxLen; i += 1) {
    const row = { game: i + 1 };
    players.forEach((p) => {
      const arr = byPlayer[p];
      if (i < arr.length) {
        row[p] = arr.slice(0, i + 1).reduce((s, e) => s + e.goals + e.assists, 0);
      }
    });
    data.push(row);
  }
  return data;
}

function buildTotalsBar(entries, players, season) {
  return players.map((p) => {
    const arr = entries.filter((e) => e.player === p && seasonLabel(e.date) === season);
    return {
      player: p,
      Голы: arr.reduce((s, e) => s + e.goals, 0),
      Передачи: arr.reduce((s, e) => s + e.assists, 0),
    };
  });
}

function buildSeasonHistory(entries, player) {
  const bySeason = {};
  entries.filter((e) => e.player === player).forEach((e) => {
    const s = seasonLabel(e.date);
    if (!bySeason[s]) bySeason[s] = { season: s, Очки: 0 };
    bySeason[s].Очки += e.goals + e.assists;
  });
  return Object.values(bySeason).sort((a, b) => a.season.localeCompare(b.season));
}

const MONTH_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

function seasonDateRange(season) {
  const startYear = Number(season.split('-')[0]);
  return { start: `${startYear}-09-01`, end: `${startYear + 1}-08-31` };
}

function buildHeatmapWeeks(entries, player, season) {
  const { start, end } = seasonDateRange(season);
  const pointsByDate = {};
  entries
    .filter((e) => e.player === player && e.date >= start && e.date <= end)
    .forEach((e) => {
      pointsByDate[e.date] = (pointsByDate[e.date] || 0) + e.goals + e.assists;
    });
  const days = [];
  const d = new Date(`${start}T00:00:00`);
  const endD = new Date(`${end}T00:00:00`);
  while (d <= endD) {
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, points: pointsByDate[iso] || 0, weekday: (d.getDay() + 6) % 7, isFirstOfMonth: d.getDate() === 1, month: d.getMonth() });
    d.setDate(d.getDate() + 1);
  }
  const firstWeekday = days.length ? days[0].weekday : 0;
  const padded = Array(firstWeekday).fill(null).concat(days);
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

function heatColor(points) {
  if (!points) return PALETTE.panelLine;
  if (points === 1) return 'rgba(211,166,37,0.35)';
  if (points === 2) return 'rgba(211,166,37,0.65)';
  return PALETTE.gold;
}

function Avatar({ name, color, size = 36 }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Oswald, sans-serif', fontWeight: 600, color: PALETTE.navyDark,
        fontSize: size * 0.38, flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function HockeyTracker() {
  const [entries, setEntries] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [categories, setCategories] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [season, setSeason] = useState(null);
  const [newPlayerMode, setNewPlayerMode] = useState(false);
  const STAGE_OPTIONS = ['Регулярный чемпионат', 'Группа', '1/16', '1/8', 'Четвертьфинал', 'Полуфинал', 'Финал'];
  const FINISH_OPTIONS = [{ value: '', label: 'Основное время' }, { value: 'Овертайм', label: 'Овертайм' }, { value: 'Буллиты', label: 'Буллиты' }];
  const [form, setForm] = useState({
    player: DEFAULT_PLAYERS[0], date: new Date().toISOString().slice(0, 10), goals: '', assists: '',
    categoryId: 'training', matchChoice: '__new__',
    ownTeamChoice: '', newOwnTeamName: '',
    opponentTeamChoice: '', newOpponentTeamName: '',
    tournamentChoice: '', newTournamentName: '',
    stage: '', scoreOwn: '', scoreOpp: '', finish: '',
  });
  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', countsStats: true, hasTeams: false, hasTournament: false });
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formNotice, setFormNotice] = useState(null);
  const [profilePlayer, setProfilePlayer] = useState(null);
  const [profileSeason, setProfileSeason] = useState(null);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [shareNotice, setShareNotice] = useState(null);
  const [goals, setGoals] = useState({});
  const [profiles, setProfiles] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', number: '', birthDate: '', heightCm: '', weightKg: '', position: '' });
  const [profileEditError, setProfileEditError] = useState(null);
  const [goalInput, setGoalInput] = useState('');
  const [goalMetric, setGoalMetric] = useState('points');
  const [addingGoal, setAddingGoal] = useState(false);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [playersRes, matchesRes, entriesRes, goalsRes, categoriesRes, tournamentsRes, teamsRes] = await Promise.all([
          supabase.from('players').select('*'),
          supabase.from('matches').select('*'),
          supabase.from('entries').select('*'),
          supabase.from('goals').select('*'),
          supabase.from('categories').select('*'),
          supabase.from('tournaments').select('*'),
          supabase.from('teams').select('*'),
        ]);

        let playerRows = playersRes.data || [];
        let matchRows = matchesRes.data || [];
        let entryRows = entriesRes.data || [];
        let categoryRows = categoriesRes.data || [];
        let tournamentRows = tournamentsRes.data || [];
        let teamRows = teamsRes.data || [];

        if (playersRes.error) {
          console.error('Supabase players select error:', playersRes.error);
          setError(`Не удалось прочитать таблицу players: ${playersRes.error.message}`);
        }
        if (categoriesRes.error) {
          console.error('Supabase categories select error:', categoriesRes.error);
          setError(`Таблицы категорий/турниров/команд ещё не созданы — выполните schema_v2.sql в Supabase.`);
        }

        // Each reference table is seeded independently and is safe to retry on its own —
        // if a previous attempt got partway through (e.g. categories landed but tournaments
        // didn't), the next page load fills in exactly what's still missing.
        const seedErrors = [];

        if (!categoriesRes.error && categoryRows.length === 0) {
          const { error } = await supabase.from('categories').upsert(SEED_CATEGORIES.map((c) => ({
            id: c.id, name: c.name, counts_stats: c.countsStats, has_teams: c.hasTeams, has_tournament: c.hasTournament,
          })));
          if (error) seedErrors.push(`categories: ${error.message}`);
          else {
            const fresh = await supabase.from('categories').select('*');
            categoryRows = fresh.data || [];
          }
        }

        if (!categoriesRes.error && tournamentRows.length === 0) {
          for (let i = 0; i < SEED_TOURNAMENTS.length; i += 100) {
            const { error } = await supabase.from('tournaments').upsert(SEED_TOURNAMENTS.slice(i, i + 100));
            if (error) seedErrors.push(`tournaments batch ${i}: ${error.message}`);
          }
          const fresh = await supabase.from('tournaments').select('*');
          tournamentRows = fresh.data || [];
        }

        if (!categoriesRes.error && teamRows.length === 0) {
          for (let i = 0; i < SEED_TEAMS.length; i += 100) {
            const { error } = await supabase.from('teams').upsert(SEED_TEAMS.slice(i, i + 100));
            if (error) seedErrors.push(`teams batch ${i}: ${error.message}`);
          }
          const fresh = await supabase.from('teams').select('*');
          teamRows = fresh.data || [];
        }

        if (!playersRes.error && playerRows.length === 0) {
          const { error } = await supabase.from('players').upsert(DEFAULT_PLAYERS.map((name) => ({ name })));
          if (error) seedErrors.push(`players: ${error.message}`);
          const fresh = await supabase.from('players').select('*');
          playerRows = fresh.data || [];
        }

        // Matches reference tournaments/teams by id, so only rebuild history once those
        // are confirmed present — otherwise every match insert would fail on the foreign key.
        if (!categoriesRes.error && entryRows.length === 0 && tournamentRows.length > 0 && teamRows.length > 0) {
          await supabase.from('entries').delete().neq('id', '__none__');
          await supabase.from('matches').delete().neq('id', '__none__');

          const matchRowsToInsert = SEED_MATCHES.map((m) => ({
            id: m.id, date: m.date, label: m.label, category_id: m.categoryId, tournament_id: m.tournamentId,
            own_team_id: m.ownTeamId, opponent_team_id: m.opponentTeamId, score_own: m.scoreOwn, score_opp: m.scoreOpp, stage: m.stage, finish: m.finish,
          }));
          for (let i = 0; i < matchRowsToInsert.length; i += 100) {
            const { error } = await supabase.from('matches').upsert(matchRowsToInsert.slice(i, i + 100));
            if (error) seedErrors.push(`matches batch ${i}: ${error.message}`);
          }

          const entryRowsToInsert = SEED_ENTRIES.map((en) => ({
            id: en.id, player: en.player, date: en.date, goals: en.goals, assists: en.assists, match_id: en.matchId,
          }));
          for (let i = 0; i < entryRowsToInsert.length; i += 100) {
            const { error } = await supabase.from('entries').upsert(entryRowsToInsert.slice(i, i + 100));
            if (error) seedErrors.push(`entries batch ${i}: ${error.message}`);
          }

          const [freshMatches, freshEntries] = await Promise.all([
            supabase.from('matches').select('*'),
            supabase.from('entries').select('*'),
          ]);
          matchRows = freshMatches.data || [];
          entryRows = freshEntries.data || [];
        }

        if (seedErrors.length > 0) {
          console.error('Supabase seeding errors:', seedErrors);
          setError(`Не всё удалось сохранить в базу (${seedErrors[0]}). Обновите страницу через минуту — недостающее должно доехать.`);
        }

        const loadedPlayers = playerRows.map((r) => r.name);
        const loadedProfiles = {};
        playerRows.forEach((r) => { loadedProfiles[r.name] = rowToProfile(r); });
        const loadedMatches = matchRows.map((r) => ({
          id: r.id, date: r.date, label: r.label, categoryId: r.category_id, tournamentId: r.tournament_id,
          ownTeamId: r.own_team_id, opponentTeamId: r.opponent_team_id, scoreOwn: r.score_own, scoreOpp: r.score_opp, stage: r.stage, finish: r.finish,
        }));
        const loadedEntries = entryRows.map((r) => ({
          id: r.id, player: r.player, date: r.date, goals: r.goals, assists: r.assists, matchId: r.match_id,
        }));
        const loadedGoals = {};
        (goalsRes.data || []).forEach((r) => {
          const key = `${r.player}|${r.season}`;
          if (!loadedGoals[key]) loadedGoals[key] = {};
          loadedGoals[key][r.metric] = r.target;
        });

        setPlayers(loadedPlayers);
        setProfiles(loadedProfiles);
        setMatches(loadedMatches);
        setEntries(loadedEntries);
        setGoals(loadedGoals);
        setCategories(categoryRows.map((r) => ({
          id: r.id, name: r.name, countsStats: r.counts_stats, hasTeams: r.has_teams, hasTournament: r.has_tournament,
        })));
        setTournaments(tournamentRows.map((r) => ({ id: r.id, name: r.name })));
        setTeams(teamRows.map((r) => ({ id: r.id, name: r.name })));
        const seasons = Array.from(new Set(loadedEntries.map((x) => seasonLabel(x.date)))).sort().reverse();
        setSeason(seasons[0] || seasonLabel(new Date().toISOString().slice(0, 10)));
      } catch (err) {
        setError('Не удалось загрузить данные из базы. Проверьте соединение и обновите страницу.');
      }
      setLoading(false);
    })();
  }, []);

  function rowToProfile(row) {
    const bio = {};
    if (row.number != null) bio.number = row.number;
    if (row.birth_date) bio.birthDate = row.birth_date;
    if (row.height_cm != null) bio.heightCm = row.height_cm;
    if (row.weight_kg != null) bio.weightKg = row.weight_kg;
    if (row.position) bio.position = row.position;
    return bio;
  }

  // Each of these updates local state immediately (so the UI feels instant) and
  // fires the matching Supabase write in the background, surfacing an error if it fails.
  async function persistEntries(updated) {
    setEntries(updated);
  }

  async function insertEntryRow(entry) {
    const { error: err } = await supabase.from('entries').insert({
      id: entry.id, player: entry.player, date: entry.date, goals: entry.goals, assists: entry.assists, match_id: entry.matchId,
    });
    if (err) setError('Не удалось сохранить изменения. Попробуйте ещё раз.');
  }

  async function deleteEntryRow(id) {
    const { error: err } = await supabase.from('entries').delete().eq('id', id);
    if (err) setError('Не удалось удалить запись. Попробуйте ещё раз.');
  }

  async function persistMatches(updated) {
    setMatches(updated);
  }

  async function insertMatchRow(match) {
    const { error: err } = await supabase.from('matches').insert({
      id: match.id, date: match.date, label: match.label, category_id: match.categoryId, tournament_id: match.tournamentId,
      own_team_id: match.ownTeamId, opponent_team_id: match.opponentTeamId, score_own: match.scoreOwn, score_opp: match.scoreOpp,
      stage: match.stage, finish: match.finish,
    });
    if (err) setError('Не удалось сохранить матч. Попробуйте ещё раз.');
  }

  async function persistTournaments(updated) {
    setTournaments(updated);
  }

  async function persistTeams(updated) {
    setTeams(updated);
  }

  async function persistCategories(updated) {
    setCategories(updated);
  }

  async function persistPlayers(updated) {
    setPlayers(updated);
  }

  async function insertPlayerRow(name) {
    const { error: err } = await supabase.from('players').insert({ name });
    if (err) setError('Не удалось добавить игрока. Попробуйте ещё раз.');
  }

  async function renamePlayerRow(oldName, newName) {
    // players.name is referenced by entries.player and goals.player with ON UPDATE CASCADE,
    // so a single update here renames it everywhere in the database automatically.
    const { error: err } = await supabase.from('players').update({ name: newName }).eq('name', oldName);
    if (err) setError('Не удалось переименовать игрока. Попробуйте ещё раз.');
  }

  async function persistGoals(updated) {
    setGoals(updated);
  }

  async function upsertGoalRow(player, season, metric, target) {
    const { error: err } = await supabase.from('goals').upsert({ player, season, metric, target });
    if (err) setError('Не удалось сохранить цель. Попробуйте ещё раз.');
  }

  async function deleteGoalRow(player, season, metric) {
    const { error: err } = await supabase.from('goals').delete().match({ player, season, metric });
    if (err) setError('Не удалось сбросить цель. Попробуйте ещё раз.');
  }

  async function persistProfiles(updated) {
    setProfiles(updated);
  }

  async function updateProfileRow(name, bio) {
    const { error: err } = await supabase.from('players').update({
      number: bio.number || null,
      birth_date: bio.birthDate || null,
      height_cm: bio.heightCm || null,
      weight_kg: bio.weightKg || null,
      position: bio.position || null,
    }).eq('name', name);
    if (err) setError('Не удалось сохранить данные игрока. Попробуйте ещё раз.');
  }

  async function insertCategoryRow(cat) {
    const { error: err } = await supabase.from('categories').insert({
      id: cat.id, name: cat.name, counts_stats: cat.countsStats, has_teams: cat.hasTeams, has_tournament: cat.hasTournament,
    });
    if (err) setError('Не удалось создать категорию. Попробуйте ещё раз.');
  }

  async function insertTournamentRow(t) {
    const { error: err } = await supabase.from('tournaments').insert({ id: t.id, name: t.name });
    if (err) setError('Не удалось создать турнир. Попробуйте ещё раз.');
  }

  async function insertTeamRow(t) {
    const { error: err } = await supabase.from('teams').insert({ id: t.id, name: t.name });
    if (err) setError('Не удалось создать команду. Попробуйте ещё раз.');
  }

  async function updateMatchRow(matchId, fields) {
    const payload = {};
    if ('scoreOwn' in fields) payload.score_own = fields.scoreOwn;
    if ('scoreOpp' in fields) payload.score_opp = fields.scoreOpp;
    if ('stage' in fields) payload.stage = fields.stage;
    const { error: err } = await supabase.from('matches').update(payload).eq('id', matchId);
    if (err) setError('Не удалось обновить матч. Попробуйте ещё раз.');
  }

  async function handleAddGame(e) {
    e.preventDefault();
    setFormNotice(null);
    if (!form.date) {
      setFormNotice({ type: 'error', text: 'Укажите дату игры — без неё запись не сохранится.' });
      return;
    }
    if (!form.player) {
      setFormNotice({ type: 'error', text: 'Выберите игрока.' });
      return;
    }
    const category = categories.find((c) => c.id === form.categoryId);
    if (!category) {
      setFormNotice({ type: 'error', text: 'Выберите категорию игры.' });
      return;
    }
    setSaving(true);
    try {
      let matchId = form.matchChoice;
      if (matchId === '__new__') {
        let workingTeams = teams;
        let workingTournaments = tournaments;
        let ownTeamId = null;
        let opponentTeamId = null;
        let tournamentId = null;
        const legionId = workingTeams.find((t) => t.name === 'Легион')?.id || null;
        const ownChoice = form.ownTeamChoice || legionId || '__new__';
        const oppChoice = form.opponentTeamChoice || '__new__';
        const tourChoice = form.tournamentChoice || '__new__';

        if (category.hasTeams) {
          if (ownChoice === '__new__') {
            const name = form.newOwnTeamName.trim() || 'Легион';
            const existing = workingTeams.find((t) => t.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              ownTeamId = existing.id;
            } else {
              const newTeam = { id: `tm${Date.now()}`, name };
              workingTeams = [...workingTeams, newTeam];
              await persistTeams(workingTeams);
              await insertTeamRow(newTeam);
              ownTeamId = newTeam.id;
            }
          } else {
            ownTeamId = ownChoice;
          }
          const oppName = form.newOpponentTeamName.trim();
          if (oppChoice === '__new__') {
            if (!oppName) {
              setFormNotice({ type: 'error', text: 'Укажите команду соперника.' });
              setSaving(false);
              return;
            }
            const existingOpp = workingTeams.find((t) => t.name.toLowerCase() === oppName.toLowerCase());
            if (existingOpp) {
              opponentTeamId = existingOpp.id;
            } else {
              const newTeam = { id: `tm${Date.now()}o`, name: oppName };
              workingTeams = [...workingTeams, newTeam];
              await persistTeams(workingTeams);
              await insertTeamRow(newTeam);
              opponentTeamId = newTeam.id;
            }
          } else {
            opponentTeamId = oppChoice;
          }
        }

        if (category.hasTournament) {
          if (tourChoice === '__new__') {
            const name = form.newTournamentName.trim();
            if (!name) {
              setFormNotice({ type: 'error', text: 'Укажите турнир.' });
              setSaving(false);
              return;
            }
            const existingT = workingTournaments.find((t) => t.name.toLowerCase() === name.toLowerCase());
            if (existingT) {
              tournamentId = existingT.id;
            } else {
              const newT = { id: `t${Date.now()}`, name };
              workingTournaments = [...workingTournaments, newT];
              await persistTournaments(workingTournaments);
              await insertTournamentRow(newT);
              tournamentId = newT.id;
            }
          } else {
            tournamentId = tourChoice;
          }
        }

        const ownName = ownTeamId ? workingTeams.find((t) => t.id === ownTeamId)?.name : null;
        const oppName2 = opponentTeamId ? workingTeams.find((t) => t.id === opponentTeamId)?.name : null;
        const tourName = tournamentId ? workingTournaments.find((t) => t.id === tournamentId)?.name : null;
        const label = category.hasTeams
          ? [tourName, ownName && oppName2 ? `${ownName} - ${oppName2}` : null].filter(Boolean).join('. ') || category.name
          : `${category.name} ${fmtDate(form.date)}`;

        const newMatch = {
          id: `m${Date.now()}`,
          date: form.date,
          label,
          categoryId: category.id,
          tournamentId,
          ownTeamId,
          opponentTeamId,
          scoreOwn: form.scoreOwn !== '' ? Number(form.scoreOwn) : null,
          scoreOpp: form.scoreOpp !== '' ? Number(form.scoreOpp) : null,
          stage: form.stage || null,
          finish: category.hasTeams ? (form.finish || null) : null,
        };
        await persistMatches([...matches, newMatch]);
        await insertMatchRow(newMatch);
        matchId = newMatch.id;
      }
      const entry = {
        id: `e${Date.now()}`,
        player: form.player,
        date: form.date,
        goals: category.countsStats ? (Number(form.goals) || 0) : 0,
        assists: category.countsStats ? (Number(form.assists) || 0) : 0,
        matchId,
      };
      await persistEntries([...entries, entry]);
      await insertEntryRow(entry);
      setForm({
        ...form, goals: '', assists: '', matchChoice: '__new__',
        ownTeamChoice: '', newOwnTeamName: '', opponentTeamChoice: '', newOpponentTeamName: '',
        tournamentChoice: '', newTournamentName: '', stage: '', scoreOwn: '', scoreOpp: '', finish: '',
      });
      setFormNotice({ type: 'success', text: `Игра записана: ${entry.goals}Г ${entry.assists}П за ${entry.player}.` });
    } catch (err) {
      setFormNotice({ type: 'error', text: 'Не получилось сохранить игру. Попробуйте ещё раз.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory() {
    const name = newCategoryForm.name.trim();
    if (!name) return;
    const id = `cat${Date.now()}`;
    const newCat = {
      id, name, countsStats: newCategoryForm.countsStats, hasTeams: newCategoryForm.hasTeams,
      hasTournament: newCategoryForm.hasTeams && newCategoryForm.hasTournament,
    };
    await persistCategories([...categories, newCat]);
    await insertCategoryRow(newCat);
    setForm((f) => ({ ...f, categoryId: id, matchChoice: '__new__', ownTeamChoice: '', newOwnTeamName: '', opponentTeamChoice: '', newOpponentTeamName: '', tournamentChoice: '', newTournamentName: '', stage: '', scoreOwn: '', scoreOpp: '', finish: '' }));
    setNewCategoryMode(false);
    setNewCategoryForm({ name: '', countsStats: true, hasTeams: false, hasTournament: false });
  }

  async function handleDelete(id) {
    await persistEntries(entries.filter((e) => e.id !== id));
    await deleteEntryRow(id);
    setConfirmDeleteId(null);
  }

  const entryToDelete = confirmDeleteId ? entries.find((e) => e.id === confirmDeleteId) : null;

  async function handleAddPlayer(name) {
    const trimmed = name.trim();
    if (!trimmed || players.includes(trimmed)) return;
    await persistPlayers([...players, trimmed]);
    await insertPlayerRow(trimmed);
    setForm((f) => ({ ...f, player: trimmed }));
    setNewPlayerMode(false);
  }

  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const teamsById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const tournamentsById = useMemo(() => Object.fromEntries(tournaments.map((t) => [t.id, t])), [tournaments]);
  const matchesById = useMemo(() => Object.fromEntries(matches.map((m) => [m.id, m])), [matches]);

  function finishSuffix(m) {
    return m.finish === 'Овертайм' ? ' ОТ' : m.finish === 'Буллиты' ? ' Б' : '';
  }

  function matchLabel(matchId) {
    const m = matchesById[matchId];
    if (!m) return '—';
    const cat = categoriesById[m.categoryId];
    if (!cat || !cat.hasTeams) return m.label || cat?.name || '—';
    const own = m.ownTeamId ? teamsById[m.ownTeamId]?.name : null;
    const opp = m.opponentTeamId ? teamsById[m.opponentTeamId]?.name : null;
    const tour = m.tournamentId ? tournamentsById[m.tournamentId]?.name : null;
    const score = m.scoreOwn != null && m.scoreOpp != null ? ` ${m.scoreOwn}:${m.scoreOpp}${finishSuffix(m)}` : '';
    const teamsPart = own && opp ? `${own} - ${opp}${score}` : (m.label || cat.name);
    return [tour, m.stage, teamsPart].filter(Boolean).join(' · ');
  }

  function isCountableEntry(entry) {
    const m = matchesById[entry.matchId];
    if (!m) return true;
    const cat = categoriesById[m.categoryId];
    return !cat || cat.countsStats !== false;
  }

  function handleExportCsv() {
    const header = ['Дата', 'Игрок', 'Голы', 'Передачи', 'Очки', 'Категория', 'Матч'];
    const rows = [...entries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => {
        const m = matchesById[e.matchId];
        const cat = m ? categoriesById[m.categoryId] : null;
        return [fmtDate(e.date), e.player, e.goals, e.assists, e.goals + e.assists, cat?.name || '', matchLabel(e.matchId)];
      });
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(escape).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hockey-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const countableEntries = useMemo(() => entries.filter(isCountableEntry), [entries, matchesById, categoriesById]);
  const stats = useMemo(() => computeStats(countableEntries, players), [countableEntries, players]);
  const seasons = useMemo(
    () => Array.from(new Set(entries.map((e) => seasonLabel(e.date)))).sort().reverse(),
    [entries],
  );
  const currentSeason = season || seasons[0];
  const seasonEntries = useMemo(
    () => entries.filter((e) => seasonLabel(e.date) === currentSeason),
    [entries, currentSeason],
  );
  const seasonCountableEntries = useMemo(
    () => countableEntries.filter((e) => seasonLabel(e.date) === currentSeason),
    [countableEntries, currentSeason],
  );
  const seasonStats = useMemo(() => computeStats(seasonCountableEntries, players), [seasonCountableEntries, players]);
  const activePlayers = useMemo(
    () => players.filter((p) => seasonCountableEntries.some((e) => e.player === p)),
    [players, seasonCountableEntries],
  );
  const cumulativeData = useMemo(
    () => (currentSeason ? buildCumulativeSeries(countableEntries, activePlayers, currentSeason) : []),
    [countableEntries, activePlayers, currentSeason],
  );
  const totalsBar = useMemo(
    () => (currentSeason ? buildTotalsBar(countableEntries, activePlayers, currentSeason) : []),
    [countableEntries, activePlayers, currentSeason],
  );
  const seasonGP = new Set(seasonEntries.map((e) => e.matchId)).size;
  const leader = seasonStats.leaderboard.find((p) => p.gp > 0);
  const recentEntries = [...seasonEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  const matchesForDate = useMemo(
    () => matches.filter((m) => m.date === form.date && m.categoryId === form.categoryId),
    [matches, form.date, form.categoryId],
  );
  const categoryBreakdown = useMemo(() => {
    const byCat = {};
    categories.forEach((c) => { byCat[c.id] = { category: c, games: new Set(), goals: 0, assists: 0, points: 0 }; });
    entries.forEach((e) => {
      const m = matchesById[e.matchId];
      if (!m) return;
      if (!byCat[m.categoryId]) return;
      byCat[m.categoryId].games.add(m.id);
      byCat[m.categoryId].goals += e.goals;
      byCat[m.categoryId].assists += e.assists;
      byCat[m.categoryId].points += e.goals + e.assists;
    });
    return Object.values(byCat).map((c) => ({ ...c, games: c.games.size })).filter((c) => c.games > 0);
  }, [entries, matchesById, categories]);
  function playerCategoryBreakdown(player) {
    const byCat = {};
    categories.forEach((c) => { byCat[c.id] = { category: c, games: 0, goals: 0, assists: 0, points: 0 }; });
    entries.filter((e) => e.player === player).forEach((e) => {
      const m = matchesById[e.matchId];
      if (!m || !byCat[m.categoryId]) return;
      byCat[m.categoryId].games += 1;
      byCat[m.categoryId].goals += e.goals;
      byCat[m.categoryId].assists += e.assists;
      byCat[m.categoryId].points += e.goals + e.assists;
    });
    return Object.values(byCat).filter((c) => c.games > 0);
  }
  function seasonTeamRecord(seasonEntriesList) {
    const matchIds = new Set(seasonEntriesList.map((e) => e.matchId));
    let wins = 0; let losses = 0; let draws = 0;
    matchIds.forEach((id) => {
      const m = matchesById[id];
      if (!m || m.scoreOwn == null || m.scoreOpp == null) return;
      if (m.scoreOwn > m.scoreOpp) wins += 1;
      else if (m.scoreOwn < m.scoreOpp) losses += 1;
      else draws += 1;
    });
    return { wins, losses, draws };
  }

  const activeCareerPlayers = stats.leaderboard.filter((p) => p.gp > 0).map((p) => p.player);
  const seasonAwards = useMemo(() => {
    const points = {};
    const goals = {};
    const assists = {};
    seasons.filter(isSeasonComplete).forEach((s) => {
      const gamesInSeason = countableEntries.filter((e) => seasonLabel(e.date) === s);
      const active = computeStats(gamesInSeason, players).leaderboard.filter((p) => p.gp > 0);
      if (!active.length) return;
      const topPoints = active[0];
      points[topPoints.player] = (points[topPoints.player] || 0) + 1;
      const topGoals = [...active].sort((a, b) => b.goals - a.goals)[0];
      goals[topGoals.player] = (goals[topGoals.player] || 0) + 1;
      const topAssists = [...active].sort((a, b) => b.assists - a.assists)[0];
      assists[topAssists.player] = (assists[topAssists.player] || 0) + 1;
    });
    return { points, goals, assists };
  }, [countableEntries, players, seasons]);
  const seasonWrapped = useMemo(() => {
    if (!currentSeason || seasonCountableEntries.length === 0) return null;
    const topScorer = seasonStats.leaderboard.find((p) => p.gp > 0) || null;
    const topAssist = [...seasonStats.leaderboard].filter((p) => p.gp > 0).sort((a, b) => b.assists - a.assists)[0] || null;
    const bestGame = seasonCountableEntries.reduce((best, e) => {
      const pts = e.goals + e.assists;
      return !best || pts > best.points ? { ...e, points: pts } : best;
    }, null);
    const totals = seasonCountableEntries.reduce((acc, e) => {
      acc.goals += e.goals;
      acc.assists += e.assists;
      acc.points += e.goals + e.assists;
      if (e.goals >= 3) acc.hatTricks += 1;
      if (e.goals >= 4) acc.poker += 1;
      return acc;
    }, { goals: 0, assists: 0, points: 0, hatTricks: 0, poker: 0 });
    const idx = seasons.indexOf(currentSeason);
    const prevSeason = idx >= 0 ? seasons[idx + 1] : null;
    let mostImproved = null;
    if (prevSeason) {
      const prevEntries = countableEntries.filter((e) => seasonLabel(e.date) === prevSeason);
      const prevStats = computeStats(prevEntries, players);
      players.forEach((pl) => {
        const cur = seasonStats.byPlayer[pl];
        const prev = prevStats.byPlayer[pl];
        if (cur && prev && cur.gp > 0 && prev.gp > 0) {
          const delta = cur.ppg - prev.ppg;
          if (!mostImproved || delta > mostImproved.delta) mostImproved = { player: pl, delta, curPpg: cur.ppg, prevPpg: prev.ppg };
        }
      });
    }
    const record = seasonTeamRecord(seasonEntries);
    return { topScorer, topAssist, bestGame, totals, mostImproved, prevSeason, gamesCount: seasonGP, record };
  }, [currentSeason, seasonCountableEntries, seasonEntries, seasonStats, seasons, countableEntries, players, seasonGP]);
  const playerA = compareA && activeCareerPlayers.includes(compareA) ? compareA : activeCareerPlayers[0];
  const playerB = compareB && activeCareerPlayers.includes(compareB) ? compareB : activeCareerPlayers[1];
  const profileStats = profilePlayer ? stats.byPlayer[profilePlayer] : null;
  const profileSeasonHistory = useMemo(
    () => (profilePlayer ? buildSeasonHistory(countableEntries, profilePlayer) : []),
    [countableEntries, profilePlayer],
  );
  const activeProfileSeason = profileSeason || currentSeason;
  const profileHeatmap = useMemo(
    () => (profilePlayer && activeProfileSeason ? buildHeatmapWeeks(countableEntries, profilePlayer, activeProfileSeason) : []),
    [countableEntries, profilePlayer, activeProfileSeason],
  );
  const profileRecent = profilePlayer
    ? [...entries].filter((e) => e.player === profilePlayer).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
    : [];

  function openProfile(name) {
    setProfilePlayer(name);
    setProfileSeason(currentSeason);
    setShareNotice(null);
    setAddingGoal(false);
    setGoalInput('');
    setEditingProfile(false);
    setProfileEditError(null);
    const bio = profiles[name] || {};
    setEditForm({
      name,
      number: bio.number != null ? String(bio.number) : '',
      birthDate: bio.birthDate || '',
      heightCm: bio.heightCm != null ? String(bio.heightCm) : '',
      weightKg: bio.weightKg != null ? String(bio.weightKg) : '',
      position: bio.position || '',
    });
  }

  async function handleSaveProfile() {
    const newName = editForm.name.trim();
    if (!newName) return;
    setProfileEditError(null);
    const oldName = profilePlayer;
    const bio = {};
    if (editForm.number.trim()) bio.number = editForm.number.trim();
    if (editForm.birthDate.trim()) bio.birthDate = editForm.birthDate.trim();
    if (editForm.heightCm.trim()) bio.heightCm = Number(editForm.heightCm);
    if (editForm.weightKg.trim()) bio.weightKg = Number(editForm.weightKg);
    if (editForm.position) bio.position = editForm.position;

    if (newName !== oldName) {
      if (players.includes(newName)) {
        setProfileEditError('Игрок с таким именем уже есть.');
        return;
      }
      // Rename in the database first (players.name cascades to entries/goals automatically),
      // then reflect the same rename in local state for an instant UI update.
      await renamePlayerRow(oldName, newName);
      await updateProfileRow(newName, bio);
      await persistPlayers(players.map((p) => (p === oldName ? newName : p)));
      await persistEntries(entries.map((en) => (en.player === oldName ? { ...en, player: newName } : en)));
      const updatedGoals = {};
      Object.entries(goals).forEach(([key, val]) => {
        const [gp, gs] = key.split('|');
        updatedGoals[gp === oldName ? `${newName}|${gs}` : key] = val;
      });
      await persistGoals(updatedGoals);
      const updatedProfiles = { ...profiles };
      delete updatedProfiles[oldName];
      updatedProfiles[newName] = bio;
      await persistProfiles(updatedProfiles);
      setProfilePlayer(newName);
    } else {
      await updateProfileRow(oldName, bio);
      await persistProfiles({ ...profiles, [oldName]: bio });
    }
    setEditingProfile(false);
  }

  const profileBio = profilePlayer ? (profiles[profilePlayer] || {}) : {};
  const profileAge = calcAge(profileBio.birthDate);
  const bioParts = [
    profileBio.position,
    profileBio.number && `№${profileBio.number}`,
    profileAge && `${profileAge} лет`,
    profileBio.heightCm && `${profileBio.heightCm} см`,
    profileBio.weightKg && `${profileBio.weightKg} кг`,
  ].filter(Boolean);

  const profileGoalsKey = profilePlayer && currentSeason ? `${profilePlayer}|${currentSeason}` : null;
  const profileGoals = (profileGoalsKey && goals[profileGoalsKey]) || {};
  const setGoalMetrics = Object.keys(profileGoals);
  const availableGoalMetrics = GOAL_METRICS.filter((m) => !setGoalMetrics.includes(m.key));

  async function handleSetGoal() {
    const target = Number(goalInput);
    if (!profileGoalsKey || !target || target <= 0) return;
    const current = goals[profileGoalsKey] || {};
    await persistGoals({ ...goals, [profileGoalsKey]: { ...current, [goalMetric]: target } });
    await upsertGoalRow(profilePlayer, currentSeason, goalMetric, target);
    setGoalInput('');
    setAddingGoal(false);
  }

  async function handleDeleteGoal(metric) {
    if (!profileGoalsKey) return;
    const current = { ...(goals[profileGoalsKey] || {}) };
    delete current[metric];
    await persistGoals({ ...goals, [profileGoalsKey]: current });
    await deleteGoalRow(profilePlayer, currentSeason, metric);
    setConfirmDeleteGoal(null);
  }

  async function handleShareProfile() {
    if (!profilePlayer) return;
    const sp = seasonStats.byPlayer[profilePlayer];
    const lines = [
      `🏒 ${profilePlayer} — сезон ${currentSeason}`,
      sp ? `${sp.points} очков (${sp.goals}Г ${sp.assists}П) за ${sp.gp} игр` : 'Пока нет игр в этом сезоне',
      `Карьера: ${profileStats.points} очков за ${profileStats.gp} игр`,
    ];
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch (err) { /* fall through to clipboard */ }
    try {
      await navigator.clipboard.writeText(text);
      setShareNotice('Скопировано в буфер обмена!');
      setTimeout(() => setShareNotice(null), 3000);
    } catch (err) {
      setShareNotice('Не удалось скопировать.');
    }
  }

  const colorFor = (name) => PLAYER_COLORS[players.indexOf(name) % PLAYER_COLORS.length];

  if (loading) {
    return (
      <div style={{ background: PALETTE.navy, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.ice, fontFamily: 'Manrope, sans-serif' }}>
        Загружаем статистику…
      </div>
    );
  }

  return (
    <div className="ht-app" style={{ background: PALETTE.navy, minHeight: '100%', fontFamily: 'Manrope, sans-serif', color: PALETTE.ice, padding: '20px 16px 40px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Manrope:wght@400;500;700;800&display=swap');
        @media (max-width: 480px) {
          .ht-app { padding: 12px 8px 24px !important; }
          .ht-hero-seg { padding: 10px 12px !important; }
          .ht-hero-num { font-size: 22px !important; }
          .ht-hero-season { font-size: 18px !important; }
          .ht-panel { padding: 10px !important; }
          .ht-tabs { padding-bottom: 2px !important; }
          .ht-tab-btn { padding: 8px 8px !important; font-size: 12px !important; gap: 4px !important; }
          .ht-modal-box { padding: 14px !important; }
          .ht-row { padding: 8px 10px !important; }
          .ht-form-input { padding: 7px 8px !important; font-size: 13px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Scoreboard hero */}
        <div style={{ border: `1px solid ${PALETTE.panelLine}`, background: PALETTE.navyDark, borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${PALETTE.panelLine}` }}>
            <div className="ht-hero-seg" style={{ flex: 1, padding: '18px 20px', borderRight: `1px solid ${PALETTE.panelLine}`, minWidth: 0 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.3, color: PALETTE.iceDim, marginBottom: 6 }}>Сезон</div>
              <select
                value={currentSeason || ''}
                onChange={(e) => setSeason(e.target.value)}
                className="ht-hero-season"
                style={{ background: 'transparent', border: 'none', color: PALETTE.gold, fontFamily: 'Oswald, sans-serif', fontSize: 22, fontWeight: 600, outline: 'none', width: '100%' }}
              >
                {seasons.map((s) => <option key={s} value={s} style={{ background: PALETTE.navy }}>{s}</option>)}
              </select>
            </div>
            <div className="ht-hero-seg" style={{ flex: 1, padding: '18px 20px', minWidth: 0 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.3, color: PALETTE.iceDim, marginBottom: 6 }}>Игр сыграно</div>
              <div className="ht-hero-num" style={{ fontFamily: 'Oswald, sans-serif', fontSize: 28, fontWeight: 600 }}>{seasonGP}</div>
            </div>
          </div>
          <div className="ht-hero-seg" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: 0.3, color: PALETTE.iceDim, marginBottom: 6 }}>Лидер по очкам</div>
            {leader ? (
              <button
                onClick={() => openProfile(leader.player)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                <Avatar name={leader.player} color={colorFor(leader.player)} />
                <div>
                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600, lineHeight: 1.1, color: PALETTE.ice }}>{leader.player}</div>
                  <div style={{ color: PALETTE.gold, fontSize: 13 }}>{leader.points} очков</div>
                </div>
              </button>
            ) : <div style={{ color: PALETTE.iceDim }}>Пока нет игр</div>}
          </div>
        </div>

        {/* Tabs */}
        <div className="ht-tabs" style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${PALETTE.panelLine}`, overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
          {[
            ['dashboard', 'Дашборд', TrendingUp],
            ['leaderboard', 'Рейтинг', Trophy],
            ['achievements', 'Достижения', Flame],
            ['compare', 'Сравнение', Users],
            ['wrapped', 'Итоги', Sparkles],
            ['log', 'Игры', Target],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="ht-tab-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'none',
                border: 'none', borderBottom: tab === key ? `2px solid ${PALETTE.red}` : '2px solid transparent',
                color: tab === key ? PALETTE.ice : PALETTE.iceDim, fontFamily: 'Manrope, sans-serif',
                fontWeight: tab === key ? 700 : 500, fontSize: 14, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(200,40,63,0.15)', border: `1px solid ${PALETTE.red}`, borderRadius: 4, padding: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {tab === 'dashboard' && (
          <div>
            <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, marginBottom: 12 }}>Очки нарастающим итогом за сезон {currentSeason}</div>
              {cumulativeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={cumulativeData} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid stroke={PALETTE.panelLine} strokeDasharray="3 3" />
                    <XAxis dataKey="game" stroke={PALETTE.iceDim} fontSize={12} label={{ value: 'Игра №', position: 'insideBottom', offset: -3, fill: PALETTE.iceDim, fontSize: 11 }} />
                    <YAxis stroke={PALETTE.iceDim} fontSize={12} />
                    <Tooltip contentStyle={{ background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {activePlayers.map((p) => (
                      <Line key={p} type="monotone" dataKey={p} stroke={colorFor(p)} strokeWidth={2} dot={false} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{ color: PALETTE.iceDim, fontSize: 13 }}>Нет данных за этот сезон.</div>}
            </div>

            <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16 }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, marginBottom: 12 }}>Голы и передачи за сезон</div>
              {totalsBar.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={totalsBar} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid stroke={PALETTE.panelLine} strokeDasharray="3 3" />
                    <XAxis dataKey="player" stroke={PALETTE.iceDim} fontSize={12} />
                    <YAxis stroke={PALETTE.iceDim} fontSize={12} />
                    <Tooltip contentStyle={{ background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Голы" fill={PALETTE.red} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Передачи" fill={PALETTE.steel} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color: PALETTE.iceDim, fontSize: 13 }}>Нет данных за этот сезон.</div>}
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, overflow: 'hidden' }}>
            <div className="ht-row" style={{ padding: '10px 16px', fontSize: 12, color: PALETTE.iceDim, borderBottom: `1px solid ${PALETTE.panelLine}` }}>Сезон {currentSeason}</div>
            <div className="ht-row" style={{ display: 'grid', gridTemplateColumns: '24px 1fr 34px 34px 34px 46px', padding: '10px 16px', fontSize: 11, color: PALETTE.iceDim, borderBottom: `1px solid ${PALETTE.panelLine}` }}>
              <div>#</div><div>Игрок</div><div>Г</div><div>П</div><div>О</div><div>О/И</div>
            </div>
            {seasonStats.leaderboard.filter((p) => p.gp > 0).map((p, i) => (
              <div
                key={p.player}
                className="ht-row"
                style={{
                  display: 'grid', gridTemplateColumns: '24px 1fr 34px 34px 34px 46px', alignItems: 'center',
                  padding: '12px 16px', borderBottom: `1px solid ${PALETTE.panelLine}`,
                  background: i === 0 && p.gp > 0 ? 'rgba(211,166,37,0.08)' : 'transparent',
                }}
              >
                <div style={{ fontFamily: 'Oswald, sans-serif', color: i === 0 ? PALETTE.gold : PALETTE.iceDim }}>{i + 1}</div>
                <button
                  onClick={() => openProfile(p.player)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', minWidth: 0 }}
                >
                  <Avatar name={p.player} color={colorFor(p.player)} size={28} />
                  <span style={{ fontWeight: 600, color: PALETTE.ice, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.player}</span>
                  {computeTrend(stats.byPlayer[p.player]) === 'up' && <TrendingUp size={14} color={PALETTE.gold} style={{ flexShrink: 0 }} title="В ударе: последние игры сильнее средних" />}
                  {computeTrend(stats.byPlayer[p.player]) === 'down' && <TrendingDown size={14} color={PALETTE.iceDim} style={{ flexShrink: 0 }} title="Спад формы: последние игры слабее средних" />}
                </button>
                <div>{p.goals}</div>
                <div>{p.assists}</div>
                <div style={{ fontWeight: 700 }}>{p.points}</div>
                <div style={{ color: PALETTE.iceDim, fontSize: 13 }}>{p.ppg.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'achievements' && (
          <div>
            <div style={{ fontSize: 12, color: PALETTE.iceDim, marginBottom: 12 }}>За всю карьеру, все сезоны</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {stats.leaderboard.filter((p) => p.gp > 0).map((p) => (
                <div key={p.player} className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16 }}>
                  <button
                    onClick={() => openProfile(p.player)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Avatar name={p.player} color={colorFor(p.player)} />
                    <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 17, fontWeight: 600, color: PALETTE.ice }}>{p.player}</span>
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    {p.multiPointGames > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.iceDim }}>Игры с 2+ очками</span><span style={{ fontWeight: 700 }}>{p.multiPointGames}</span>
                      </div>
                    )}
                    {p.hatTricks > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.iceDim }}>Хет-трики</span><span style={{ fontWeight: 700 }}>{p.hatTricks}</span>
                      </div>
                    )}
                    {p.pokerGames > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.iceDim }}>Покер (4+ гола)</span><span style={{ fontWeight: 700 }}>{p.pokerGames}</span>
                      </div>
                    )}
                    {p.pentaTricks > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.purple }}>Пента-трик (5 голов)</span><span style={{ fontWeight: 700, color: PALETTE.purple }}>{p.pentaTricks}</span>
                      </div>
                    )}
                    {p.goalMadness > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.red }}>Голевое безумие (6+)</span><span style={{ fontWeight: 700, color: PALETTE.red }}>{p.goalMadness}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: PALETTE.iceDim }}>Лучшая игра</span>
                      <span style={{ fontWeight: 700 }}>{p.bestGame ? `${p.bestGame.points} очк. (${fmtDate(p.bestGame.date)})` : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: PALETTE.iceDim }}>Текущая серия</span>
                      <span style={{ fontWeight: 700, color: p.currentStreak >= 3 ? PALETTE.gold : PALETTE.ice }}>{p.currentStreak} игр подряд с очком</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: PALETTE.iceDim }}>Лучшая серия</span><span style={{ fontWeight: 700 }}>{p.longestStreak}</span>
                    </div>
                    {seasonAwards.points[p.player] > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.iceDim }}>Сезонов лучшим бомбардиром</span><span style={{ fontWeight: 700 }}>{seasonAwards.points[p.player]}</span>
                      </div>
                    )}
                    {seasonAwards.goals[p.player] > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.iceDim }}>Сезонов лучшим снайпером</span><span style={{ fontWeight: 700 }}>{seasonAwards.goals[p.player]}</span>
                      </div>
                    )}
                    {seasonAwards.assists[p.player] > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: PALETTE.iceDim }}>Сезонов лучшим ассистентом</span><span style={{ fontWeight: 700 }}>{seasonAwards.assists[p.player]}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: PALETTE.iceDim }}>Карьера</span><span style={{ fontWeight: 700 }}>{p.points} очков за {p.gp} игр</span>
                    </div>
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].filter((m) => p.points >= m).slice(-1).map((m) => (
                      <div key={m} style={{ marginTop: 4, fontSize: 12, color: PALETTE.gold, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame size={13} /> Клуб {m}+ очков
                      </div>
                    ))}
                    {MILESTONES_50.filter((m) => p.goals >= m).slice(-1).map((m) => (
                      <div key={`goals${m}`} style={{ fontSize: 12, color: PALETTE.red, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame size={13} /> Клуб {m}+ голов
                      </div>
                    ))}
                    {MILESTONES_50.filter((m) => p.assists >= m).slice(-1).map((m) => (
                      <div key={`a${m}`} style={{ fontSize: 12, color: PALETTE.steel, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame size={13} /> Клуб {m}+ передач
                      </div>
                    ))}
                    {MILESTONES_50.filter((m) => p.gp >= m).slice(-1).map((m) => (
                      <div key={`g${m}`} style={{ fontSize: 12, color: PALETTE.teal, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame size={13} /> Клуб {m}+ игр
                      </div>
                    ))}
                    {(() => {
                      const nm = nearestMilestone(p);
                      if (!nm || nm.remaining > 20) return null;
                      return (
                        <div style={{ marginTop: 4, fontSize: 12, color: PALETTE.ice, background: 'rgba(211,166,37,0.12)', border: `1px solid ${PALETTE.gold}`, borderRadius: 4, padding: '5px 8px' }}>
                          Почти! До клуба {nm.target}+ {nm.label} осталось {nm.remaining}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'compare' && (
          <div>
            <div style={{ fontSize: 12, color: PALETTE.iceDim, marginBottom: 12 }}>За всю карьеру, все сезоны</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <select
                value={playerA || ''}
                onChange={(ev) => setCompareA(ev.target.value)}
                style={{ flex: '1 1 140px', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
              >
                {activeCareerPlayers.filter((p) => p !== playerB).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', color: PALETTE.iceDim, fontFamily: 'Oswald, sans-serif' }}>vs</div>
              <select
                value={playerB || ''}
                onChange={(ev) => setCompareB(ev.target.value)}
                style={{ flex: '1 1 140px', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
              >
                {activeCareerPlayers.filter((p) => p !== playerA).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {playerA && playerB && playerA !== playerB ? (() => {
              const a = stats.byPlayer[playerA];
              const b = stats.byPlayer[playerB];
              const colorA = colorFor(playerA);
              const colorB = colorFor(playerB);
              const rows = [
                ['Очки', a.points, b.points],
                ['Голы', a.goals, b.goals],
                ['Передачи', a.assists, b.assists],
                ['Игр', a.gp, b.gp],
                ['Очков/игру', Number(a.ppg.toFixed(2)), Number(b.ppg.toFixed(2))],
                ['Хет-трики', a.hatTricks, b.hatTricks],
                ['Игры с 2+ очками', a.multiPointGames, b.multiPointGames],
              ];
              return (
                <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <button onClick={() => openProfile(playerA)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <Avatar name={playerA} color={colorA} />
                      <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: PALETTE.ice }}>{playerA}</span>
                    </button>
                    <span style={{ color: PALETTE.iceDim, fontFamily: 'Oswald, sans-serif', fontSize: 13 }}>VS</span>
                    <button onClick={() => openProfile(playerB)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: PALETTE.ice }}>{playerB}</span>
                      <Avatar name={playerB} color={colorB} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {rows.map(([label, va, vb]) => {
                      const total = va + vb;
                      const pctA = total > 0 ? (va / total) * 100 : 50;
                      const pctB = 100 - pctA;
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, color: va >= vb ? colorA : PALETTE.iceDim }}>{va}</span>
                            <span style={{ color: PALETTE.iceDim, fontSize: 12 }}>{label}</span>
                            <span style={{ fontWeight: 700, color: vb >= va ? colorB : PALETTE.iceDim }}>{vb}</span>
                          </div>
                          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: PALETTE.panelLine }}>
                            <div style={{ width: `${pctA}%`, background: colorA }} />
                            <div style={{ width: `${pctB}%`, background: colorB }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : (
              <div style={{ color: PALETTE.iceDim, fontSize: 13 }}>Выберите двух разных игроков для сравнения.</div>
            )}
          </div>
        )}

        {tab === 'wrapped' && (
          <div>
            {seasonWrapped ? (
              <>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Итоги сезона {currentSeason}</div>
                <div style={{ fontSize: 13, color: PALETTE.iceDim, marginBottom: 16 }}>{seasonWrapped.gamesCount} игр сыграно вместе</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {seasonWrapped.topScorer && (
                    <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.gold}`, borderRadius: 4, padding: 16 }}>
                      <div style={{ fontSize: 11, color: PALETTE.iceDim, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Trophy size={13} color={PALETTE.gold} /> Лучший бомбардир</div>
                      <button onClick={() => openProfile(seasonWrapped.topScorer.player)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <Avatar name={seasonWrapped.topScorer.player} color={colorFor(seasonWrapped.topScorer.player)} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: PALETTE.ice }}>{seasonWrapped.topScorer.player}</div>
                          <div style={{ fontSize: 12, color: PALETTE.gold }}>{seasonWrapped.topScorer.points} очков</div>
                        </div>
                      </button>
                    </div>
                  )}
                  {seasonWrapped.topAssist && seasonWrapped.topAssist.assists > 0 && (
                    <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16 }}>
                      <div style={{ fontSize: 11, color: PALETTE.iceDim, marginBottom: 8 }}>Лучший ассистент</div>
                      <button onClick={() => openProfile(seasonWrapped.topAssist.player)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <Avatar name={seasonWrapped.topAssist.player} color={colorFor(seasonWrapped.topAssist.player)} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: PALETTE.ice }}>{seasonWrapped.topAssist.player}</div>
                          <div style={{ fontSize: 12, color: PALETTE.steel }}>{seasonWrapped.topAssist.assists} передач</div>
                        </div>
                      </button>
                    </div>
                  )}
                  {seasonWrapped.bestGame && (
                    <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16 }}>
                      <div style={{ fontSize: 11, color: PALETTE.iceDim, marginBottom: 8 }}>Игра сезона</div>
                      <button onClick={() => openProfile(seasonWrapped.bestGame.player)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <Avatar name={seasonWrapped.bestGame.player} color={colorFor(seasonWrapped.bestGame.player)} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: PALETTE.ice }}>{seasonWrapped.bestGame.player}</div>
                          <div style={{ fontSize: 12, color: PALETTE.red }}>{seasonWrapped.bestGame.points} очков ({fmtDate(seasonWrapped.bestGame.date)})</div>
                        </div>
                      </button>
                    </div>
                  )}
                  {seasonWrapped.mostImproved && seasonWrapped.mostImproved.delta > 0 && (
                    <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16 }}>
                      <div style={{ fontSize: 11, color: PALETTE.iceDim, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={13} color={PALETTE.teal} /> Самый прогрессирующий</div>
                      <button onClick={() => openProfile(seasonWrapped.mostImproved.player)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <Avatar name={seasonWrapped.mostImproved.player} color={colorFor(seasonWrapped.mostImproved.player)} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: PALETTE.ice }}>{seasonWrapped.mostImproved.player}</div>
                          <div style={{ fontSize: 12, color: PALETTE.teal }}>{seasonWrapped.mostImproved.prevPpg.toFixed(2)} → {seasonWrapped.mostImproved.curPpg.toFixed(2)} очк./игру</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, marginBottom: 10 }}>Общий зачёт компании</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 12, fontSize: 13 }}>
                    <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Голы</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600 }}>{seasonWrapped.totals.goals}</div></div>
                    <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Передачи</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600 }}>{seasonWrapped.totals.assists}</div></div>
                    <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Очки</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600 }}>{seasonWrapped.totals.points}</div></div>
                    <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Хет-трики</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600 }}>{seasonWrapped.totals.hatTricks}</div></div>
                    <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Покер+</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600 }}>{seasonWrapped.totals.poker}</div></div>
                  </div>
                </div>

                {(seasonWrapped.record.wins + seasonWrapped.record.losses + seasonWrapped.record.draws) > 0 && (
                  <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, marginBottom: 10 }}>Результаты в матчах со счётом</div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                      <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Победы</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 22, fontWeight: 600, color: PALETTE.teal }}>{seasonWrapped.record.wins}</div></div>
                      <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Поражения</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 22, fontWeight: 600, color: PALETTE.red }}>{seasonWrapped.record.losses}</div></div>
                      <div><div style={{ color: PALETTE.iceDim, fontSize: 11 }}>Ничьи</div><div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 22, fontWeight: 600 }}>{seasonWrapped.record.draws}</div></div>
                    </div>
                  </div>
                )}

                {categoryBreakdown.length > 0 && (
                  <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16 }}>
                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, marginBottom: 10 }}>Игры по категориям (за всё время)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      {categoryBreakdown.map((c) => (
                        <div key={c.category.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: PALETTE.iceDim }}>{c.category.name}</span>
                          <span>{c.games} игр{c.category.countsStats ? ` · ${c.points} очк.` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: PALETTE.iceDim, fontSize: 13 }}>В этом сезоне пока нет игр — итоги появятся, когда наберётся статистика.</div>
            )}
          </div>
        )}

        {tab === 'log' && (
          <div>
            <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, marginBottom: 12 }}>Добавить игру</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Игрок</label>
                  {!newPlayerMode ? (
                    <select
                      value={form.player}
                      onChange={(ev) => (ev.target.value === '__newplayer__' ? setNewPlayerMode(true) : setForm({ ...form, player: ev.target.value }))}
                      className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    >
                      {players.map((p) => <option key={p} value={p}>{p}</option>)}
                      <option value="__newplayer__">+ новый игрок</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        autoFocus
                        placeholder="Имя"
                        onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); handleAddPlayer(ev.target.value); } }}
                        className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                      />
                      <button type="button" onClick={() => setNewPlayerMode(false)} style={{ background: 'none', border: 'none', color: PALETTE.iceDim, cursor: 'pointer' }}><X size={16} /></button>
                    </div>
                  )}
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Дата</label>
                  <input
                    type="date" value={form.date}
                    onChange={(ev) => setForm({ ...form, date: ev.target.value, matchChoice: '__new__', ownTeamChoice: '', newOwnTeamName: '', opponentTeamChoice: '', newOpponentTeamName: '', tournamentChoice: '', newTournamentName: '', stage: '', scoreOwn: '', scoreOpp: '', finish: '' })}
                    className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Категория игры</label>
                {!newCategoryMode ? (
                  <select
                    value={form.categoryId}
                    onChange={(ev) => (ev.target.value === '__newcat__'
                      ? setNewCategoryMode(true)
                      : setForm({ ...form, categoryId: ev.target.value, matchChoice: '__new__', ownTeamChoice: '', newOwnTeamName: '', opponentTeamChoice: '', newOpponentTeamName: '', tournamentChoice: '', newTournamentName: '', stage: '', scoreOwn: '', scoreOpp: '', finish: '' }))}
                    className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="__newcat__">+ новая категория</option>
                  </select>
                ) : (
                  <div style={{ background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 10 }}>
                    <input
                      autoFocus placeholder="Название категории (например, «Мастер-класс»)"
                      value={newCategoryForm.name}
                      onChange={(ev) => setNewCategoryForm({ ...newCategoryForm, name: ev.target.value })}
                      className="ht-form-input" style={{ width: '100%', background: PALETTE.navy, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13, marginBottom: 8 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: PALETTE.iceDim, marginBottom: 6 }}>
                      <input type="checkbox" checked={newCategoryForm.countsStats} onChange={(ev) => setNewCategoryForm({ ...newCategoryForm, countsStats: ev.target.checked })} />
                      Учитывать голы/передачи в статистике
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: PALETTE.iceDim, marginBottom: 8 }}>
                      <input type="checkbox" checked={newCategoryForm.hasTeams} onChange={(ev) => setNewCategoryForm({ ...newCategoryForm, hasTeams: ev.target.checked })} />
                      Это матч с командами и счётом
                    </label>
                    {newCategoryForm.hasTeams && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: PALETTE.iceDim, marginBottom: 8, marginLeft: 16 }}>
                        <input type="checkbox" checked={newCategoryForm.hasTournament} onChange={(ev) => setNewCategoryForm({ ...newCategoryForm, hasTournament: ev.target.checked })} />
                        Относится к турниру
                      </label>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={handleAddCategory} style={{ background: PALETTE.red, border: 'none', color: PALETTE.ice, borderRadius: 4, padding: '7px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Создать</button>
                      <button type="button" onClick={() => setNewCategoryMode(false)} style={{ background: 'none', border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '7px 12px', fontSize: 13, cursor: 'pointer' }}>Отмена</button>
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const category = categories.find((c) => c.id === form.categoryId);
                if (!category) return null;
                return (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Матч</label>
                      {form.date && matchesForDate.length > 0 ? (
                        <select
                          value={form.matchChoice}
                          onChange={(ev) => setForm({ ...form, matchChoice: ev.target.value })}
                          className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                        >
                          {matchesForDate.map((m) => <option key={m.id} value={m.id}>{matchLabel(m.id)}</option>)}
                          <option value="__new__">+ своя игра (не из списка)</option>
                        </select>
                      ) : (
                        <div style={{ fontSize: 12, color: PALETTE.iceDim }}>
                          {form.date ? `На эту дату ещё никто не заносил «${category.name}» — заполните ниже.` : 'Сначала выберите дату.'}
                        </div>
                      )}
                    </div>

                    {form.matchChoice === '__new__' && category.hasTeams && (() => {
                      const legionId = teams.find((t) => t.name === 'Легион')?.id || null;
                      const ownEffective = form.ownTeamChoice || legionId || '__new__';
                      const oppEffective = form.opponentTeamChoice || '__new__';
                      return (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Своя команда</label>
                              <select
                                value={ownEffective}
                                onChange={(ev) => setForm({ ...form, ownTeamChoice: ev.target.value })}
                                className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                              >
                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                <option value="__new__">+ новая команда...</option>
                              </select>
                              {ownEffective === '__new__' && (
                                <input
                                  placeholder="Название команды" value={form.newOwnTeamName}
                                  onChange={(ev) => setForm({ ...form, newOwnTeamName: ev.target.value })}
                                  className="ht-form-input" style={{ width: '100%', marginTop: 6, background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                                />
                              )}
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Команда соперника</label>
                              <select
                                value={oppEffective}
                                onChange={(ev) => setForm({ ...form, opponentTeamChoice: ev.target.value })}
                                className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                              >
                                <option value="__new__">+ новая команда...</option>
                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                              {oppEffective === '__new__' && (
                                <input
                                  placeholder="Название команды" value={form.newOpponentTeamName}
                                  onChange={(ev) => setForm({ ...form, newOpponentTeamName: ev.target.value })}
                                  className="ht-form-input" style={{ width: '100%', marginTop: 6, background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                                />
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                            <div style={{ width: 64 }}>
                              <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Счёт</label>
                              <input
                                type="number" min="0" placeholder="—" value={form.scoreOwn}
                                onChange={(ev) => setForm({ ...form, scoreOwn: ev.target.value })}
                                className="ht-form-input" style={{ width: '100%', textAlign: 'center', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 6px', fontSize: 13 }}
                              />
                            </div>
                            <div style={{ paddingBottom: 9, color: PALETTE.iceDim, fontWeight: 700 }}>:</div>
                            <div style={{ width: 64 }}>
                              <input
                                type="number" min="0" placeholder="—" value={form.scoreOpp}
                                onChange={(ev) => setForm({ ...form, scoreOpp: ev.target.value })}
                                className="ht-form-input" style={{ width: '100%', textAlign: 'center', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 6px', fontSize: 13, marginTop: 21 }}
                              />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                              <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Итог</label>
                              <select
                                value={form.finish}
                                onChange={(ev) => setForm({ ...form, finish: ev.target.value })}
                                className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                              >
                                {FINISH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {form.matchChoice === '__new__' && category.hasTournament && (() => {
                      const tourEffective = form.tournamentChoice || '__new__';
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Турнир</label>
                            <select
                              value={tourEffective}
                              onChange={(ev) => setForm({ ...form, tournamentChoice: ev.target.value })}
                              className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                            >
                              <option value="__new__">+ новый турнир...</option>
                              {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {tourEffective === '__new__' && (
                              <input
                                placeholder="Название турнира" value={form.newTournamentName}
                                onChange={(ev) => setForm({ ...form, newTournamentName: ev.target.value })}
                                className="ht-form-input" style={{ width: '100%', marginTop: 6, background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                              />
                            )}
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Стадия</label>
                            <select
                              value={form.stage}
                              onChange={(ev) => setForm({ ...form, stage: ev.target.value })}
                              className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                            >
                              <option value="">Не указана</option>
                              {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      );
                    })()}

                    {category.countsStats && (
                      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: '0 1 90px' }}>
                          <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Голы</label>
                          <input
                            type="number" min="0" value={form.goals}
                            onChange={(ev) => setForm({ ...form, goals: ev.target.value })}
                            className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                          />
                        </div>
                        <div style={{ flex: '0 1 90px' }}>
                          <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Передачи</label>
                          <input
                            type="number" min="0" value={form.assists}
                            onChange={(ev) => setForm({ ...form, assists: ev.target.value })}
                            className="ht-form-input" style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div style={{ fontSize: 11, color: PALETTE.iceDim, marginBottom: 12 }}>
                Если в этот день уже кто-то занёс игру этой же категории — выберите её из списка, чтобы одна и та же игра не считалась дважды.
              </div>
              <button
                type="button" disabled={saving} onClick={handleAddGame}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: PALETTE.red, color: PALETTE.ice, border: 'none', borderRadius: 4, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                <Plus size={15} /> {saving ? 'Сохраняем…' : 'Записать игру'}
              </button>
              {formNotice && (
                <div
                  style={{
                    marginTop: 10, fontSize: 13, padding: '8px 12px', borderRadius: 4,
                    color: formNotice.type === 'error' ? PALETTE.red : PALETTE.teal,
                    background: formNotice.type === 'error' ? 'rgba(200,40,63,0.12)' : 'rgba(46,156,143,0.12)',
                    border: `1px solid ${formNotice.type === 'error' ? PALETTE.red : PALETTE.teal}`,
                  }}
                >
                  {formNotice.text}
                </div>
              )}
            </div>

            <div style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${PALETTE.panelLine}` }}>
                <span style={{ fontSize: 13, color: PALETTE.iceDim }}>Игры сезона {currentSeason}</span>
                <button
                  onClick={handleExportCsv}
                  style={{ background: 'none', border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.iceDim, borderRadius: 4, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                >
                  Скачать CSV (для таблицы)
                </button>
              </div>
              {recentEntries.map((e) => (
                <div key={e.id} className="ht-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', padding: '10px 16px', borderBottom: `1px solid ${PALETTE.panelLine}`, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 0 }}>
                    <span style={{ color: PALETTE.iceDim, flexShrink: 0 }}>{fmtDate(e.date)}</span>
                    <button
                      onClick={() => openProfile(e.player)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                    >
                      <Avatar name={e.player} color={colorFor(e.player)} size={24} />
                      <span style={{ fontWeight: 600, color: PALETTE.ice }}>{e.player}</span>
                    </button>
                    <span style={{ flexShrink: 0 }}>{e.goals}Г {e.assists}П</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 0 }}>
                    <span style={{ flex: 1, color: PALETTE.iceDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{matchLabel(e.matchId)}</span>
                    <button onClick={() => setConfirmDeleteId(e.id)} style={{ background: 'none', border: 'none', color: PALETTE.iceDim, cursor: 'pointer', flexShrink: 0 }}><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 12, color: PALETTE.iceDim, textAlign: 'center' }}>
          Данные общие: их видят и могут дополнять все, у кого есть ссылка на это приложение.
        </div>
      </div>

      {entryToDelete && (
        <div
          onClick={() => setConfirmDeleteId(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(7,21,34,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50,
          }}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="ht-modal-box"
            style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 6, padding: 20, maxWidth: 340, width: '100%' }}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Удалить запись?</div>
            <div style={{ fontSize: 13, color: PALETTE.iceDim, marginBottom: 4 }}>
              {fmtDate(entryToDelete.date)} · {entryToDelete.player} · {entryToDelete.goals}Г {entryToDelete.assists}П
            </div>
            <div style={{ fontSize: 13, color: PALETTE.iceDim, marginBottom: 18 }}>{matchLabel(entryToDelete.matchId)}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ background: 'none', border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(entryToDelete.id)}
                style={{ background: PALETTE.red, border: 'none', color: PALETTE.ice, borderRadius: 4, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteGoal && (
        <div
          onClick={() => setConfirmDeleteGoal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(7,21,34,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 60,
          }}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="ht-modal-box"
            style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 6, padding: 20, maxWidth: 340, width: '100%' }}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Сбросить цель?</div>
            <div style={{ fontSize: 13, color: PALETTE.iceDim, marginBottom: 18 }}>
              Цель «{profileGoals[confirmDeleteGoal]} {GOAL_METRICS.find((m) => m.key === confirmDeleteGoal)?.label}» на сезон {currentSeason} для {profilePlayer} будет удалена.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDeleteGoal(null)}
                style={{ background: 'none', border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteGoal(confirmDeleteGoal)}
                style={{ background: PALETTE.red, border: 'none', color: PALETTE.ice, borderRadius: 4, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}

      {profilePlayer && profileStats && (
        <div
          onClick={() => setProfilePlayer(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(7,21,34,0.75)', display: 'flex',
            alignItems: 'flex-start', justifyContent: 'center', padding: 20, zIndex: 50, overflowY: 'auto',
          }}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="ht-modal-box"
            style={{ background: PALETTE.navy, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 6, padding: 20, maxWidth: 560, width: '100%', marginTop: 30 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={profilePlayer} color={colorFor(profilePlayer)} size={44} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 22, fontWeight: 600 }}>{profilePlayer}</div>
                  {computeTrend(profileStats) === 'up' && <TrendingUp size={18} color={PALETTE.gold} title="В ударе" />}
                  {computeTrend(profileStats) === 'down' && <TrendingDown size={18} color={PALETTE.iceDim} title="Спад формы" />}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={handleShareProfile} title="Поделиться" style={{ background: 'none', border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, color: PALETTE.iceDim, cursor: 'pointer', padding: 6, display: 'flex' }}><Share2 size={16} /></button>
                <button onClick={() => setProfilePlayer(null)} style={{ background: 'none', border: 'none', color: PALETTE.iceDim, cursor: 'pointer' }}><X size={18} /></button>
              </div>
            </div>
            {shareNotice && (
              <div style={{ fontSize: 12, color: PALETTE.teal, marginBottom: 10 }}>{shareNotice}</div>
            )}

            {!editingProfile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: PALETTE.iceDim }}>
                  {bioParts.length > 0 ? bioParts.join(' · ') : 'Данные игрока не указаны'}
                </div>
                <button
                  onClick={() => setEditingProfile(true)}
                  style={{ background: 'none', border: 'none', color: PALETTE.steel, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Изменить
                </button>
              </div>
            ) : (
              <div className="ht-panel" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Имя</label>
                    <input
                      value={editForm.name}
                      onChange={(ev) => setEditForm({ ...editForm, name: ev.target.value })}
                      className="ht-form-input"
                      style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ flex: '0 1 80px' }}>
                    <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Номер</label>
                    <input
                      value={editForm.number}
                      onChange={(ev) => setEditForm({ ...editForm, number: ev.target.value })}
                      className="ht-form-input"
                      style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Дата рождения</label>
                    <input
                      type="date" value={editForm.birthDate}
                      onChange={(ev) => setEditForm({ ...editForm, birthDate: ev.target.value })}
                      className="ht-form-input"
                      style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Амплуа</label>
                    <select
                      value={editForm.position}
                      onChange={(ev) => setEditForm({ ...editForm, position: ev.target.value })}
                      className="ht-form-input"
                      style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    >
                      <option value="">Не указано</option>
                      <option value="Нападающий">Нападающий</option>
                      <option value="Защитник">Защитник</option>
                      <option value="Вратарь">Вратарь</option>
                    </select>
                  </div>
                  <div style={{ flex: '0 1 90px' }}>
                    <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Рост, см</label>
                    <input
                      type="number" value={editForm.heightCm}
                      onChange={(ev) => setEditForm({ ...editForm, heightCm: ev.target.value })}
                      className="ht-form-input"
                      style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ flex: '0 1 90px' }}>
                    <label style={{ fontSize: 11, color: PALETTE.iceDim, display: 'block', marginBottom: 4 }}>Вес, кг</label>
                    <input
                      type="number" value={editForm.weightKg}
                      onChange={(ev) => setEditForm({ ...editForm, weightKg: ev.target.value })}
                      className="ht-form-input"
                      style={{ width: '100%', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                </div>
                {profileEditError && (
                  <div style={{ fontSize: 12, color: PALETTE.red, marginBottom: 8 }}>{profileEditError}</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleSaveProfile}
                    style={{ background: PALETTE.red, border: 'none', color: PALETTE.ice, borderRadius: 4, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    style={{ background: 'none', border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 13, background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 14 }} className="ht-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Карьера</span><span style={{ fontWeight: 700 }}>{profileStats.points} очков за {profileStats.gp} игр</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Г/П</span><span style={{ fontWeight: 700 }}>{profileStats.goals}/{profileStats.assists}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Очков/игру</span><span style={{ fontWeight: 700 }}>{profileStats.ppg.toFixed(2)}</span></div>
              {profileStats.multiPointGames > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Игры с 2+ очками</span><span style={{ fontWeight: 700 }}>{profileStats.multiPointGames}</span></div>
              )}
              {profileStats.hatTricks > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Хет-трики</span><span style={{ fontWeight: 700 }}>{profileStats.hatTricks}</span></div>
              )}
              {profileStats.pokerGames > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Покер (4+ гола)</span><span style={{ fontWeight: 700 }}>{profileStats.pokerGames}</span></div>
              )}
              {profileStats.pentaTricks > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.purple }}>Пента-трик (5 голов)</span><span style={{ fontWeight: 700, color: PALETTE.purple }}>{profileStats.pentaTricks}</span></div>
              )}
              {profileStats.goalMadness > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.red }}>Голевое безумие (6+)</span><span style={{ fontWeight: 700, color: PALETTE.red }}>{profileStats.goalMadness}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: PALETTE.iceDim }}>Лучшая игра</span>
                <span style={{ fontWeight: 700 }}>{profileStats.bestGame ? `${profileStats.bestGame.points} очк. (${fmtDate(profileStats.bestGame.date)})` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: PALETTE.iceDim }}>Текущая серия</span>
                <span style={{ fontWeight: 700, color: profileStats.currentStreak >= 3 ? PALETTE.gold : PALETTE.ice }}>{profileStats.currentStreak} игр подряд с очком</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Лучшая серия</span><span style={{ fontWeight: 700 }}>{profileStats.longestStreak}</span></div>
              {seasonAwards.points[profilePlayer] > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Сезонов лучшим бомбардиром</span><span style={{ fontWeight: 700 }}>{seasonAwards.points[profilePlayer]}</span></div>
              )}
              {seasonAwards.goals[profilePlayer] > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Сезонов лучшим снайпером</span><span style={{ fontWeight: 700 }}>{seasonAwards.goals[profilePlayer]}</span></div>
              )}
              {seasonAwards.assists[profilePlayer] > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PALETTE.iceDim }}>Сезонов лучшим ассистентом</span><span style={{ fontWeight: 700 }}>{seasonAwards.assists[profilePlayer]}</span></div>
              )}
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].filter((m) => profileStats.points >= m).slice(-1).map((m) => (
                <div key={m} style={{ fontSize: 12, color: PALETTE.gold, display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={13} /> Клуб {m}+ очков</div>
              ))}
              {MILESTONES_50.filter((m) => profileStats.goals >= m).slice(-1).map((m) => (
                <div key={`goals${m}`} style={{ fontSize: 12, color: PALETTE.red, display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={13} /> Клуб {m}+ голов</div>
              ))}
              {MILESTONES_50.filter((m) => profileStats.assists >= m).slice(-1).map((m) => (
                <div key={`a${m}`} style={{ fontSize: 12, color: PALETTE.steel, display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={13} /> Клуб {m}+ передач</div>
              ))}
              {MILESTONES_50.filter((m) => profileStats.gp >= m).slice(-1).map((m) => (
                <div key={`g${m}`} style={{ fontSize: 12, color: PALETTE.teal, display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={13} /> Клуб {m}+ игр</div>
              ))}
              {(() => {
                const nm = nearestMilestone(profileStats);
                if (!nm || nm.remaining > 20) return null;
                return (
                  <div style={{ marginTop: 4, fontSize: 12, color: PALETTE.ice, background: 'rgba(211,166,37,0.12)', border: `1px solid ${PALETTE.gold}`, borderRadius: 4, padding: '5px 8px' }}>
                    Почти! До клуба {nm.target}+ {nm.label} осталось {nm.remaining}
                  </div>
                );
              })()}
            </div>

            <div style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 14, marginBottom: 16 }} className="ht-panel">
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, marginBottom: 10 }}>Цели на сезон {currentSeason}</div>

              {setGoalMetrics.length === 0 && !addingGoal && (
                <div style={{ fontSize: 12, color: PALETTE.iceDim, marginBottom: 10 }}>Целей пока нет</div>
              )}

              {setGoalMetrics.map((metric) => {
                const target = profileGoals[metric];
                const current = metricValue(seasonStats.byPlayer[profilePlayer], metric);
                const label = GOAL_METRICS.find((m) => m.key === metric)?.label;
                const done = current >= target;
                return (
                  <div key={metric} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: PALETTE.iceDim }}>{current} из {target} {label}</span>
                      <button onClick={() => setConfirmDeleteGoal(metric)} style={{ background: 'none', border: 'none', color: PALETTE.iceDim, cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: PALETTE.panelLine, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (current / target) * 100)}%`, height: '100%', background: done ? PALETTE.teal : PALETTE.gold }} />
                    </div>
                    {done && (
                      <div style={{ marginTop: 6, fontSize: 12, color: PALETTE.teal, display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={13} /> Цель достигнута!</div>
                    )}
                  </div>
                );
              })}

              {availableGoalMetrics.length > 0 && (
                addingGoal ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="number" min="1" placeholder="Число" value={goalInput}
                      onChange={(ev) => setGoalInput(ev.target.value)}
                      className="ht-form-input"
                      style={{ flex: '1 1 80px', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    />
                    <select
                      value={goalMetric}
                      onChange={(ev) => setGoalMetric(ev.target.value)}
                      className="ht-form-input"
                      style={{ flex: '1 1 120px', background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.ice, borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
                    >
                      {availableGoalMetrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                    <button
                      onClick={handleSetGoal}
                      style={{ background: PALETTE.red, border: 'none', color: PALETTE.ice, borderRadius: 4, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    >
                      Задать
                    </button>
                    <button
                      onClick={() => setAddingGoal(false)}
                      style={{ background: 'none', border: 'none', color: PALETTE.iceDim, cursor: 'pointer', flexShrink: 0 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setGoalMetric(availableGoalMetrics[0].key); setAddingGoal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px dashed ${PALETTE.panelLine}`, color: PALETTE.iceDim, borderRadius: 4, padding: '8px 12px', fontSize: 13, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                  >
                    <Plus size={14} /> Добавить цель
                  </button>
                )
              )}
            </div>

            {profileSeasonHistory.length > 0 && (
              <div style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 14, marginBottom: 16 }}>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, marginBottom: 8 }}>Очки по сезонам</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={profileSeasonHistory} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid stroke={PALETTE.panelLine} strokeDasharray="3 3" />
                    <XAxis dataKey="season" stroke={PALETTE.iceDim} fontSize={11} />
                    <YAxis stroke={PALETTE.iceDim} fontSize={11} />
                    <Tooltip contentStyle={{ background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, fontSize: 12 }} />
                    <Bar dataKey="Очки" fill={colorFor(profilePlayer)} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {profileHeatmap.length > 0 && (
              <div style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 14, marginBottom: 16, overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14 }}>Дни игр</div>
                  <select
                    value={activeProfileSeason || ''}
                    onChange={(ev) => setProfileSeason(ev.target.value)}
                    style={{ background: PALETTE.navyDark, border: `1px solid ${PALETTE.panelLine}`, color: PALETTE.gold, borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
                  >
                    {seasons.map((s) => <option key={s} value={s} style={{ background: PALETTE.navy }}>{s}</option>)}
                  </select>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: 'repeat(7, 11px)',
                    gridTemplateColumns: `repeat(${profileHeatmap.length}, 11px)`,
                    gridAutoFlow: 'column',
                    gap: 3,
                    width: 'max-content',
                  }}
                >
                  {profileHeatmap.flatMap((week, wi) =>
                    week.map((day, di) => (
                      <div
                        key={`${wi}-${di}`}
                        title={day ? `${fmtDate(day.date)}: ${day.points} очк.` : ''}
                        style={{ width: 11, height: 11, borderRadius: 2, background: day ? heatColor(day.points) : 'transparent' }}
                      />
                    )),
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: PALETTE.iceDim }}>
                  <span>Меньше</span>
                  <div style={{ width: 11, height: 11, borderRadius: 2, background: PALETTE.panelLine }} />
                  <div style={{ width: 11, height: 11, borderRadius: 2, background: 'rgba(211,166,37,0.35)' }} />
                  <div style={{ width: 11, height: 11, borderRadius: 2, background: 'rgba(211,166,37,0.65)' }} />
                  <div style={{ width: 11, height: 11, borderRadius: 2, background: PALETTE.gold }} />
                  <span>Больше</span>
                </div>
              </div>
            )}

            {profilePlayer && playerCategoryBreakdown(profilePlayer).length > 0 && (
              <div style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, padding: 14, marginBottom: 16 }} className="ht-panel">
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, marginBottom: 8 }}>По категориям (за всё время)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  {playerCategoryBreakdown(profilePlayer).map((c) => (
                    <div key={c.category.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: PALETTE.iceDim }}>{c.category.name}</span>
                      <span>{c.games} игр{c.category.countsStats ? ` · ${c.goals}Г ${c.assists}П` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.panelLine}`, borderRadius: 4, overflow: 'hidden' }}>
              <div className="ht-row" style={{ padding: '8px 14px', fontSize: 12, color: PALETTE.iceDim, borderBottom: `1px solid ${PALETTE.panelLine}` }}>Последние игры</div>
              {profileRecent.map((e) => (
                <div className="ht-row" key={e.id} style={{ display: 'flex', gap: 10, padding: '8px 14px', borderBottom: `1px solid ${PALETTE.panelLine}`, fontSize: 13 }}>
                  <span style={{ color: PALETTE.iceDim, width: 78 }}>{fmtDate(e.date)}</span>
                  <span style={{ width: 90 }}>{e.goals}Г {e.assists}П</span>
                  <span style={{ flex: 1, color: PALETTE.iceDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matchLabel(e.matchId)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
