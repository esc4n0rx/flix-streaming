import { Skeleton } from "@/components/ui/skeleton"

export function ContentSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pt-16">
      {/* Featured content skeleton */}
      <div className="w-full h-[80vh] relative">
        <Skeleton className="w-full h-full bg-gray-800" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <Skeleton className="h-12 w-2/3 mb-4 bg-gray-800" />
          <Skeleton className="h-6 w-1/2 mb-2 bg-gray-800" />
          <Skeleton className="h-6 w-1/3 mb-6 bg-gray-800" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 bg-gray-800" />
            <Skeleton className="h-12 w-32 bg-gray-800" />
          </div>
        </div>
      </div>

      {/* Content rows skeleton */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        {[1, 2, 3].map((row) => (
          <div key={row}>
            <Skeleton className="h-8 w-64 mb-6 bg-gray-800" />
            <div className="flex space-x-4 overflow-x-hidden">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="flex-shrink-0 w-48 h-72 rounded-lg bg-gray-800" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
