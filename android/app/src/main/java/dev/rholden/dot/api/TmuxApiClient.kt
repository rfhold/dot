package dev.rholden.dot.api

import dev.rholden.dot.data.SessionsResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

class TmuxApiClient(private val serverUrl: String) {

    private val json = Json { ignoreUnknownKeys = true }

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    suspend fun getSessions(token: String? = null): Result<SessionsResponse> = withContext(Dispatchers.IO) {
        try {
            val requestBuilder = Request.Builder()
                .url("$serverUrl/api/sessions")
                .get()

            if (!token.isNullOrBlank()) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }

            val response = client.newCall(requestBuilder.build()).execute()
            response.use { resp ->
                if (!resp.isSuccessful) {
                    return@withContext Result.failure(
                        IOException("HTTP ${resp.code}: ${resp.message}")
                    )
                }

                val body = resp.body?.string()
                    ?: return@withContext Result.failure(IOException("Empty response body"))

                val sessions = json.decodeFromString<SessionsResponse>(body)
                Result.success(sessions)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    companion object {
        private val healthClient = OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build()

        suspend fun checkHealth(serverUrl: String): Result<Boolean> = withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url("$serverUrl/health")
                    .get()
                    .build()

                val response = healthClient.newCall(request).execute()
                response.use { resp ->
                    if (resp.code == 200) {
                        Result.success(true)
                    } else {
                        Result.failure(IOException("Health check failed: HTTP ${resp.code}"))
                    }
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
}
