import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { getUserStats, getMatchHistory, getAchievements } from "../api/game"
import { type UserStats, type MatchRecord, type Achievement } from "../api/game"
import { useTranslation } from "react-i18next"

function ProfilePage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [matches, setMatches] = useState<MatchRecord[]>([])
    const [achievements, setAchievements] = useState<Achievement[]>([])

    useEffect(() => {
      if (!user) return
      const controller = new AbortController()
      getUserStats(user.id, controller.signal).then(setStats).catch(() => {})
      getMatchHistory(user.id, 1, controller.signal).then(setMatches).catch(() => {})
      getAchievements(user.id).then(setAchievements).catch(() => {})
      return () => controller.abort()
    }, [user])

    return (
      <div className="bg-[#0f0f13] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center flex-1 text-[#f0eeff] pt-12 px-4 pb-12">

          {/* Avatar + name */}
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover mb-4" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-3xl font-bold mb-4">
              {user ? (user.username || user.email)[0].toUpperCase() : '?'}
            </div>
          )}
          <p className="text-xl font-semibold mb-1">{user?.username || user?.email}</p>
          <p className="text-sm text-[#8892a4] mb-2">{t('profile.member')}</p>

          {/* Level + XP bar */}
          {stats && (
            <p className="text-[#e2b96f] text-lg font-semibold mb-8">{t('profile.elo')}: {stats.elo}</p>
          )}

          {/* Stats cards */}
          <div className="flex gap-4 mb-10">
            <div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
              <div className="text-2xl font-semibold text-green-400">{stats?.wins ?? 0}</div>
              <div className="text-xs text-[#8892a4] mt-1">{t('home.wins')}</div>
            </div>
            <div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
              <div className="text-2xl font-semibold text-[#e25f5f]">{stats?.losses ?? 0}</div>
              <div className="text-xs text-[#8892a4] mt-1">{t('home.losses')}</div>
            </div>
            <div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
              <div className="text-2xl font-semibold text-[#8892a4]">{stats?.draws ?? 0}</div>
              <div className="text-xs text-[#8892a4] mt-1">{t('home.draws')}</div>
            </div>
            <div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
              <div className="text-2xl font-semibold text-[#e2b96f]">#{stats?.rank ?? '-'}</div>
              <div className="text-xs text-[#8892a4] mt-1">{t('home.rank')}</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile/edit')}
            className="mb-12 bg-[#1a1a24] border border-[#2e2e40] rounded-[10px] px-8 py-3 text-[#f0eeff] text-[15px] font-semibold cursor-pointer
  hover:border-[#e2b96f]"
          >
            {t('profile.editProfile')}
          </button>

          {/* Match history */}
          <div className="w-full max-w-2xl mb-10">
            <h2 className="text-lg font-semibold mb-4">{t('profile.matchHistory')}</h2>
            <div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl overflow-hidden">
              {matches.length === 0 ? (
                <p className="text-[#8892a4] text-sm px-6 py-4">{t('profile.noMatches')}</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2e2e40] text-[#8892a4] text-sm">
                      <th className="text-left px-6 py-3">{t('profile.result')}</th>
                      <th className="text-left px-6 py-3">{t('profile.opponent')}</th>
                      <th className="text-left px-6 py-3">{t('profile.duration')}</th>
                      <th className="text-left px-6 py-3">{t('profile.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map(match => (
                      <tr key={match.id} className="border-b border-[#2e2e40] last:border-0">
                        <td className="px-6 py-3">
                          <span className={
                            match.result === 'win' ? 'text-green-400 font-semibold' :
                            match.result === 'loss' ? 'text-[#e25f5f] font-semibold' :
                            'text-[#8892a4] font-semibold'
                          }>
                            {t(`profile.${match.result}`).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3">{match.opponent_name}</td>
                        <td className="px-6 py-3 text-[#8892a4]">{match.duration}</td>
                        <td className="px-6 py-3 text-[#8892a4]">{match.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">{t('profile.achievements')}</h2>
            <div className="grid grid-cols-1 gap-3">
              {achievements.map(a => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 px-6 py-4 rounded-xl border ${
                    a.unlocked
                      ? 'bg-[#1a1a24] border-[#2e2e40]'
                      : 'bg-[#13131a] border-[#2e2e40] opacity-50'
                  }`}
                >
                  <span className="text-2xl">{a.unlocked ? '🏆' : '🔒'}</span>
                  <div>
                    <p className="font-semibold text-sm">{t(`achievements.${a.id}.name`)}</p>
                    <p className="text-xs text-[#8892a4]">{t(`achievements.${a.id}.description`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        <Footer />
      </div>
    )
  }

export default ProfilePage