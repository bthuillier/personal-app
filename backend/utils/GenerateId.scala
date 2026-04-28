package utils

import java.security.MessageDigest

object GenerateId {
  private val Letters: String =
    ('a' to 'z').mkString + ('A' to 'Z').mkString // 52 chars

  def makeId(fields: String*)(length: Int = 12): String = {
    val key = fields.mkString("|")
    val digest =
      MessageDigest.getInstance("SHA-256").digest(key.getBytes("UTF-8"))
    digest
      .take(length)
      .map(b => Letters((b & 0xff) % 52))
      .mkString
  }

}
