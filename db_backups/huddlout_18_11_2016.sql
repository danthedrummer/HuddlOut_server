-- MySQL dump 10.13  Distrib 5.5.50, for debian-linux-gnu (x86_64)
--
-- Host: 0.0.0.0    Database: huddlout
-- ------------------------------------------------------
-- Server version	5.5.50-0ubuntu0.14.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `group_memberships`
--

DROP TABLE IF EXISTS `group_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_memberships` (
  `membership_id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `profile_id` int(6) unsigned NOT NULL,
  `group_id` int(6) unsigned NOT NULL,
  `group_role` varchar(10) NOT NULL,
  PRIMARY KEY (`membership_id`),
  KEY `profile_id` (`profile_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `group_memberships_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`profile_id`),
  CONSTRAINT `group_memberships_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_memberships`
--

LOCK TABLES `group_memberships` WRITE;
/*!40000 ALTER TABLE `group_memberships` DISABLE KEYS */;
INSERT INTO `group_memberships` VALUES (2,8,3,'ADMIN'),(4,8,5,'ADMIN');
/*!40000 ALTER TABLE `group_memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups` (
  `group_id` int(6) unsigned NOT NULL AUTO_INCREMENT,
  `group_name` varchar(20) NOT NULL,
  `start_date` datetime NOT NULL,
  `expiry_date` datetime NOT NULL,
  `activity_type` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (3,'test_group','2016-11-17 16:58:22','2016-11-18 16:58:22',NULL),(5,'Team Hayes','2016-11-17 17:03:53','2016-11-18 17:03:53','Database Normalizati');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `server_information`
--

DROP TABLE IF EXISTS `server_information`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `server_information` (
  `var_key` varchar(30) NOT NULL,
  `var_value` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`var_key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `server_information`
--

LOCK TABLES `server_information` WRITE;
/*!40000 ALTER TABLE `server_information` DISABLE KEYS */;
INSERT INTO `server_information` VALUES ('secret_key','9b8aaaee-796e-49f1-8739-dd7b1b97086b');
/*!40000 ALTER TABLE `server_information` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_profiles` (
  `profile_id` int(6) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(20) NOT NULL,
  `last_name` varchar(20) DEFAULT NULL,
  `profile_picture` varchar(30) DEFAULT NULL,
  `age` int(3) DEFAULT NULL,
  `decription` varchar(200) DEFAULT NULL,
  `privacy` varchar(10) DEFAULT 'PUBLIC',
  PRIMARY KEY (`profile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(2,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(3,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(4,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(5,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(6,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(7,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(8,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(9,'John','Doe','ass.jpg',25,'...lol','PUBLIC'),(12,'testUser10',NULL,NULL,NULL,NULL,'PUBLIC'),(13,'testUser11',NULL,NULL,NULL,NULL,'PUBLIC');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(6) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `password` varchar(65353) NOT NULL,
  `profile_id` int(6) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_profile_id` (`profile_id`),
  CONSTRAINT `fk_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`profile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'user1','$2a$08$lDFiE1Rd5mDEnOQexx2mfuDNSIpkv/eEdxivI6IxR4GXLG5.qfQm.',1),(2,'usernameone','$2a$08$cnDspqqjQbV0h2oHJCtlN..lh8EHXGhRuLSm2YWaALlw5VkabgNue',2),(3,'usernametwo','$2a$08$uUDemDFUpeKPalmbARNiNOSU4oNz7HWQj6so0ados6eiCfhpm5MfK',3),(4,'testuser','$2a$08$5oxP90bY4Ly7T8PlEl/EPu3GbUdXUvG4bAsOVbHpUnikgEF6jLW0G',4),(5,'paulwins','$2a$08$e0gnfm0VrHmSb05a6.y7teS.z3XvIfHMP118fwK9.fxHT0oYsH4Te',5),(6,'glennncullen','$2a$08$tbnhlbKXmiRmQJwl0iTuSuS5X4qBkYXmHY0qXo8riz8KAFnYFsoG2',6),(8,'aaron meaney','$2a$08$0xI2EJMe1dc7xr47naEYlejbmugghqECVQgN5lAROHtuZZVsNTshS',8),(9,'am_i_a_user','$2a$08$vzjek1d.O/ywSVz5NJCrqes7HCG.sRq6wH4KtdQdKVOBtlHY2utei',9),(13,'testUser10','$2a$08$XQcVvW/7SbfJGNFOtkxqHuJahPY5jYY8/dMo.q1APLueyE7TSyQ92',12),(14,'testUser11','$2a$08$eFWFxeAAeYMZDD3ixNZKe.f4YfM9d/TvZbdRG0tiGR2jz2q57jOWS',13);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-11-18 14:48:14
