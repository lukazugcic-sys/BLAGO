cmake_minimum_required(VERSION 3.18.1)
project(traffic CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(traffic SHARED
    src/RoadNetwork.cpp
    src/Pathfinder.cpp
    src/RouteWalk.cpp
    src/TrafficEngine.cpp
    src/traffic_jni.cpp)

target_include_directories(traffic PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_options(traffic PRIVATE -Wall -Wextra -Werror -fno-exceptions -fno-rtti)
target_link_libraries(traffic android log)
