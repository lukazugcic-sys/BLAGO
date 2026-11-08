package com.example.game

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Tanak omotač oko libtraffic.so.
 * Svi vrući spremnici nastaju u init bloku. updateTraffic() ne zove new.
 * Nije siguran za dva threada. Zovi ga samo s threada simulacije.
 *
 * Život: drži native handle. close() je obavezan (use ili finally), inače
 * C++ objekt ostane. Poziv nakon close() je prazan. Nema finalize().
 *
 * routeLen veći od nule je cijeli put. Negativan je krnji prefiks.
 * routeState: 0 hoda ili je stigao, 1 treba novi put, 2 zapelo.
 */
class TrafficManager(
    nodeXY: FloatArray,
    edgeFrom: IntArray,
    edgeTo: IntArray,
    edgeLen: FloatArray?,
    undirected: Boolean,
    agentCap: Int,
) : AutoCloseable {
    private var handle: Long = 0L
    private val pathCap: Int = nodeXY.size / 2
    private val pathBuf: ByteBuffer = directInts(pathCap)
    private val loadCap: Int = edgeFrom.size * if (undirected) 2 else 1
    private val loadEdges: ByteBuffer = directInts(loadCap.coerceAtLeast(1))
    private val loadAmts: ByteBuffer = directFloats(loadCap.coerceAtLeast(1))
    private var loadCount: Int = 0

    private val agentFrom = IntArray(agentCap)
    private val agentTo = IntArray(agentCap)
    private val routeBuf: ByteBuffer = directInts(agentCap * kRouteStride)
    private val posBuf: ByteBuffer = directInts(agentCap)
    private val lenBuf: ByteBuffer = directInts(agentCap)
    private val stateBuf: ByteBuffer = directInts(agentCap)
    private val seenBuf: ByteBuffer = directInts(agentCap)
    var agentCount: Int = 0
        private set

    private var lastMs: Long = 0L
    private var accMs: Long = 0L
    private var cursor: Int = 0

    init {
        require(agentCap > 0)
        require(nodeXY.size >= 2 && nodeXY.size % 2 == 0)
        val native = initNetwork(nodeXY, edgeFrom, edgeTo, edgeLen, undirected)
        require(native != 0L) { "mreža nije učitana" }
        handle = native
    }

    fun setAgent(index: Int, from: Int, to: Int) {
        if (handle == 0L || index < 0 || index >= agentFrom.size) return
        val novi = index >= agentCount || agentFrom[index] != from || agentTo[index] != to
        agentFrom[index] = from
        agentTo[index] = to
        if (index >= agentCount) agentCount = index + 1
        if (!novi) return
        posBuf.putInt(index * 4, 0)
        lenBuf.putInt(index * 4, 0)
        stateBuf.putInt(index * 4, 1)
        seenBuf.putInt(index * 4, 0)
    }

    /** Gužva na ulaznom bridu (isti redoslijed kao edgeFrom). Negativan amount zatvara brid. */
    fun stampLoad(edge: Int, amount: Float) {
        if (handle == 0L || loadCount >= loadCap) return
        loadEdges.putInt(loadCount * 4, edge)
        loadAmts.putFloat(loadCount * 4, amount)
        loadCount += 1
    }

    /**
     * Zovi iz kadra. Sama simulacija ide na 100 ms.
     * Crtanje ne čeka A*.
     */
    fun onFrame(nowMs: Long) {
        if (handle == 0L) return
        if (lastMs == 0L) {
            lastMs = nowMs
            return
        }
        var dt = nowMs - lastMs
        lastMs = nowMs
        if (dt < 0L) dt = 0L
        if (dt > 250L) dt = 250L
        accMs += dt
        if (accMs < 100L) return
        accMs -= 100L
        if (accMs > 100L) accMs = 0L
        updateTraffic()
    }

    fun updateTraffic() {
        if (handle == 0L) return
        clearLoad(handle)
        if (loadCount > 0) {
            addLoads(handle, loadEdges, loadAmts, loadCount)
            loadCount = 0
        }
        bakeCosts(handle)
        val n = agentCount
        if (n <= 0) return
        tryAdvanceAll(handle, routeBuf, kRouteStride, posBuf, lenBuf, stateBuf, seenBuf, n)
        var budget = if (n < 8) n else 8
        var i = cursor
        var scanned = 0
        while (budget > 0 && scanned < n) {
            if (stateBuf.getInt(i * 4) == 1) {
                repath(i)
                budget -= 1
            }
            i += 1
            if (i >= n) i = 0
            scanned += 1
        }
        cursor = i
    }

    fun routeCount(agent: Int): Int {
        if (agent < 0 || agent >= agentCount) return 0
        val n = lenBuf.getInt(agent * 4)
        return if (n < 0) -n else n
    }

    fun routeNode(agent: Int, step: Int): Int {
        if (step < 0 || step >= routeCount(agent)) return -1
        return routeBuf.getInt((agent * kRouteStride + step) * 4)
    }

    fun routePos(agent: Int): Int {
        if (agent < 0 || agent >= agentCount) return 0
        return posBuf.getInt(agent * 4)
    }

    /** 0 hoda ili je stigao, 1 treba put, 2 zapelo. */
    fun routeState(agent: Int): Int {
        if (agent < 0 || agent >= agentCount) return 2
        return stateBuf.getInt(agent * 4)
    }

    private fun repath(i: Int) {
        val written = findPath(handle, agentFrom[i], agentTo[i], pathBuf, pathCap)
        if (written == 0) {
            posBuf.putInt(i * 4, 0)
            lenBuf.putInt(i * 4, 0)
            stateBuf.putInt(i * 4, 2)
            seenBuf.putInt(i * 4, costGeneration(handle))
            return
        }
        val full = if (written < 0) -written else written
        val keep = if (full < kRouteStride) full else kRouteStride
        val base = i * kRouteStride
        var k = 0
        while (k < keep) {
            routeBuf.putInt((base + k) * 4, pathBuf.getInt(k * 4))
            k += 1
        }
        posBuf.putInt(i * 4, 0)
        stateBuf.putInt(i * 4, 0)
        lenBuf.putInt(i * 4, if (written < 0 || full > keep) -keep else keep)
    }

    override fun close() {
        val h = handle
        if (h == 0L) return
        handle = 0L
        destroy(h)
    }

    private external fun initNetwork(
        nodeXY: FloatArray,
        edgeFrom: IntArray,
        edgeTo: IntArray,
        edgeLen: FloatArray?,
        undirected: Boolean,
    ): Long

    private external fun clearLoad(handle: Long)
    private external fun addLoads(handle: Long, edges: ByteBuffer, amounts: ByteBuffer, count: Int)
    private external fun bakeCosts(handle: Long)
    private external fun costGeneration(handle: Long): Int
    private external fun tryAdvanceAll(
        handle: Long,
        routes: ByteBuffer,
        stride: Int,
        pos: ByteBuffer,
        lens: ByteBuffer,
        states: ByteBuffer,
        seen: ByteBuffer,
        count: Int,
    ): Int
    private external fun findPath(handle: Long, start: Int, goal: Int, out: ByteBuffer, cap: Int): Int
    private external fun destroy(handle: Long)

    companion object {
        private const val kRouteStride = 64

        init {
            System.loadLibrary("traffic")
        }

        private fun directInts(count: Int): ByteBuffer {
            return ByteBuffer.allocateDirect(count * 4).order(ByteOrder.nativeOrder())
        }

        private fun directFloats(count: Int): ByteBuffer {
            return ByteBuffer.allocateDirect(count * 4).order(ByteOrder.nativeOrder())
        }
    }
}
