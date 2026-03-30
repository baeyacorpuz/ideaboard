import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Zap, Shield, ArrowRight, History } from 'lucide-react'
import { Button } from '@/components/ui'
import { BoardTypeSelector } from './BoardTypeSelector'
import { CreateBoardModal } from './CreateBoardModal'
import type { BoardType } from '@/types'

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBoardType, setSelectedBoardType] = useState<BoardType>('retro')

  const handleCreateBoard = () => {
    setIsModalOpen(true)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 to-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            <span className="block">Collaborate in</span>
            <span className="block text-purple-600">Real Time</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Create boards for brainstorming, retrospectives, and team collaboration.
            Share the link and watch ideas come to life together.
          </p>

          {/* CTA Buttons */}
          <div className="mx-auto mt-10 flex max-w-xs flex-col items-center gap-4 sm:max-w-none sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={handleCreateBoard}
              leftIcon={<Plus className="h-5 w-5" />}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Create New Board
            </Button>
            <Link to="/history">
              <Button variant="outline" size="lg" leftIcon={<History className="h-5 w-5" />}>
                View History
              </Button>
            </Link>
          </div>

          {/* Board Type Selector Preview */}
          <div className="mx-auto mt-16 max-w-3xl">
            <p className="mb-4 text-sm font-medium text-gray-500">
              Choose a board type
            </p>
            <BoardTypeSelector
              value={selectedBoardType}
              onChange={setSelectedBoardType}
            />
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Real-time Updates"
            description="See changes instantly as team members add, edit, or vote on items."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Easy Sharing"
            description="Share a simple link with your team. No account required to participate."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Secure & Private"
            description="Each board has a unique URL. Only people with the link can access it."
          />
        </div>
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedBoardType={selectedBoardType}
      />
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        {description}
      </p>
    </div>
  )
}