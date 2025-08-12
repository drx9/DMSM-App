# CMake configuration to solve Windows path length issues
cmake_minimum_required(VERSION 3.22.1)

# Set shorter build directory paths
set(CMAKE_BINARY_DIR "C:/tmp/cmake-build")
set(CMAKE_CACHEFILE_DIR "C:/tmp/cmake-cache")
set(CMAKE_PLATFORM_INFO_DIR "C:/tmp/cmake-platform")

# Force shorter object file paths
set(CMAKE_OBJECT_PATH_MAX 200)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DCMAKE_OBJECT_PATH_MAX=200")

# Set output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "C:/tmp/cmake-output/bin")
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "C:/tmp/cmake-output/lib")
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY "C:/tmp/cmake-output/lib")

message(STATUS "CMake build directory: ${CMAKE_BINARY_DIR}")
message(STATUS "CMake cache directory: ${CMAKE_CACHEFILE_DIR}")
