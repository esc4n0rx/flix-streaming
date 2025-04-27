import { Skeleton } from "@/components/ui/skeleton"

export function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pt-16">
      {/* Backdrop skeleton */}
      <div className="relative">
        <Skeleton className="h-[70vh] w-full bg-gray-800" />

        <div className="container mx-auto px-4 relative -mt-80 z-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster skeleton */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <Skeleton className="w-full h-[400px] rounded-lg bg-gray-800" />
            </div>

            {/* Details skeleton */}
            <div className="w-full md:w-2/3 lg:w-3/4">
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4 bg-gray-800" />

                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-6 w-24 bg-gray-800" />
                  <Skeleton className="h-6 w-24 bg-gray-800" />
                  <Skeleton className="h-6 w-24 bg-gray-800" />
                </div>

                <div className="flex gap-4">
                  <Skeleton className="h-10 w-32 bg-gray-800" />
                  <Skeleton className="h-10 w-32 bg-gray-800" />
                </div>

                <div>
                  <Skeleton className="h-8 w-32 mb-2 bg-gray-800" />
                  <Skeleton className="h-6 w-full mb-2 bg-gray-800" />
                  <Skeleton className="h-6 w-full mb-2 bg-gray-800" />
                  <Skeleton className="h-6 w-2/3 bg-gray-800" />
                </div>

                <div>
                  <Skeleton className="h-8 w-32 mb-2 bg-gray-800" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-24 rounded-full bg-gray-800" />
                    <Skeleton className="h-8 w-24 rounded-full bg-gray-800" />
                    <Skeleton className="h-8 w-24 rounded-full bg-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
