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
-- Table structure for table `ballot`
--

DROP TABLE IF EXISTS `ballot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ballot` (
  `ballot_id` int(6) unsigned NOT NULL AUTO_INCREMENT,
  `profile_id` int(6) unsigned NOT NULL,
  `option_id` int(6) unsigned NOT NULL,
  PRIMARY KEY (`ballot_id`),
  KEY `profile_id` (`profile_id`),
  KEY `option_id` (`option_id`),
  CONSTRAINT `ballot_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`profile_id`) ON DELETE CASCADE,
  CONSTRAINT `ballot_ibfk_2` FOREIGN KEY (`option_id`) REFERENCES `vote_option` (`option_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ballot`
--

LOCK TABLES `ballot` WRITE;
/*!40000 ALTER TABLE `ballot` DISABLE KEYS */;
INSERT INTO `ballot` VALUES (6,6,14),(7,6,18);
/*!40000 ALTER TABLE `ballot` ENABLE KEYS */;
UNLOCK TABLES;

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
  CONSTRAINT `group_memberships_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`profile_id`) ON DELETE CASCADE,
  CONSTRAINT `group_memberships_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_memberships`
--

LOCK TABLES `group_memberships` WRITE;
/*!40000 ALTER TABLE `group_memberships` DISABLE KEYS */;
INSERT INTO `group_memberships` VALUES (1,6,1,'Member'),(2,6,2,'Member'),(3,6,3,'Fuhrer'),(4,6,4,'Member'),(5,6,5,'Admin'),(8,8,8,'ADMIN'),(12,5,5,'Member');
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
  `start_date` datetime DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `activity_type` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (1,'Mofuggers','2016-11-29 11:19:18','2016-11-30 11:19:18','Dranking'),(2,'Ghostbusters','2016-11-29 11:19:18','2016-11-30 11:19:18','Busting'),(3,'Hipstlers','2016-11-29 11:19:18','2016-11-30 11:19:18','Revolting'),(4,'Sesh','2016-11-29 11:19:18','2016-11-30 11:19:18','Cutting'),(5,'Day Drinkers','2016-11-29 11:19:18','2016-11-30 11:19:18','Fighting'),(8,'Kernel Panic','2016-11-29 18:54:57','2016-11-30 18:54:57','Hacking');
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
  `description` varchar(500) DEFAULT NULL,
  `privacy` varchar(10) DEFAULT 'PUBLIC',
  PRIMARY KEY (`profile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,'John','Doe','chess.bmp',25,'...lol','PRIVATE'),(2,'John','Doe','chess.bmp',25,'...lol','PUBLIC'),(3,'John','Doe','chess.bmp',25,'...lol','PUBLIC'),(4,'John','Doe','chess.bmp',25,'...lol','PUBLIC'),(5,'John','Doe','chess.bmp',25,'...lol','PUBLIC'),(6,'John','Doe','chess.bmp',25,'...lol','PUBLIC'),(7,'John','Doe','chess.bmp',25,'...lol','PUBLIC'),(8,'Aaron','Meaney','chess.bmp',25,'I like turtles','PUBLIC'),(9,'John','Doe','chess.bmp',25,'...lol','PUBLIC'),(12,'testUser10',NULL,'chess.bmp',NULL,NULL,'PUBLIC'),(13,'testUser11',NULL,'chess.bmp',NULL,NULL,'PUBLIC'),(14,'pwisthis',NULL,'chess.bmp',NULL,NULL,'PUBLIC'),(16,'Aaron','Meaney',NULL,NULL,NULL,'PUBLIC'),(17,'Liam','English',NULL,NULL,NULL,'PUBLIC'),(18,'Evan','Hardware',NULL,NULL,NULL,'PUBLIC');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_relationships`
--

DROP TABLE IF EXISTS `user_relationships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_relationships` (
  `relationship_id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `profile_a` int(6) unsigned NOT NULL,
  `profile_b` int(6) unsigned NOT NULL,
  `relationship_type` enum('Friend','Best Friend','Blocked','Invite') NOT NULL,
  PRIMARY KEY (`relationship_id`),
  KEY `profile_a` (`profile_a`),
  KEY `profile_b` (`profile_b`),
  CONSTRAINT `user_relationships_ibfk_1` FOREIGN KEY (`profile_a`) REFERENCES `user_profiles` (`profile_id`) ON DELETE CASCADE,
  CONSTRAINT `user_relationships_ibfk_2` FOREIGN KEY (`profile_b`) REFERENCES `user_profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_relationships`
--

LOCK TABLES `user_relationships` WRITE;
/*!40000 ALTER TABLE `user_relationships` DISABLE KEYS */;
INSERT INTO `user_relationships` VALUES (13,8,3,'Invite'),(15,5,6,'Friend'),(16,5,1,'Friend'),(17,5,2,'Friend'),(18,5,3,'Friend'),(19,5,4,'Friend'),(20,5,7,'Friend'),(21,5,8,'Friend'),(22,5,9,'Friend'),(24,5,12,'Friend'),(25,5,13,'Friend'),(26,5,14,'Friend'),(27,6,1,'Friend'),(28,6,2,'Friend'),(29,6,18,'Friend'),(30,6,17,'Friend'),(32,6,16,'Friend');
/*!40000 ALTER TABLE `user_relationships` ENABLE KEYS */;
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
  CONSTRAINT `fk_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'user1','$2a$08$lDFiE1Rd5mDEnOQexx2mfuDNSIpkv/eEdxivI6IxR4GXLG5.qfQm.',1),(2,'usernameone','$2a$08$cnDspqqjQbV0h2oHJCtlN..lh8EHXGhRuLSm2YWaALlw5VkabgNue',2),(3,'usernametwo','$2a$08$uUDemDFUpeKPalmbARNiNOSU4oNz7HWQj6so0ados6eiCfhpm5MfK',3),(4,'testuser','$2a$08$5oxP90bY4Ly7T8PlEl/EPu3GbUdXUvG4bAsOVbHpUnikgEF6jLW0G',4),(5,'paulwins','$2a$08$e0gnfm0VrHmSb05a6.y7teS.z3XvIfHMP118fwK9.fxHT0oYsH4Te',5),(6,'glennncullen','$2a$08$tbnhlbKXmiRmQJwl0iTuSuS5X4qBkYXmHY0qXo8riz8KAFnYFsoG2',6),(8,'aaron meaney','$2a$08$0xI2EJMe1dc7xr47naEYlejbmugghqECVQgN5lAROHtuZZVsNTshS',8),(9,'am_i_a_user','$2a$08$vzjek1d.O/ywSVz5NJCrqes7HCG.sRq6wH4KtdQdKVOBtlHY2utei',9),(13,'testUser10','$2a$08$XQcVvW/7SbfJGNFOtkxqHuJahPY5jYY8/dMo.q1APLueyE7TSyQ92',12),(14,'testUser11','$2a$08$eFWFxeAAeYMZDD3ixNZKe.f4YfM9d/TvZbdRG0tiGR2jz2q57jOWS',13),(15,'pwisthis','$2a$08$/N6o3tXT1cY25ae6iXc9g.HXqakfabaFFzCKwnUFToNKQvZ2AjcYa',14),(16,'a a ron','$2a$08$i1NXbCNS7I8Sjn5yaocEzuecWuGT/GZGrUrkeCrdWEaRpOjyHsOxy',16),(17,'liamenglish','$2a$08$ygJO/aHnVxfv1SwX6Qwjp.vVkgns0KQl0qSEBkkDtQuZ2wyhDGtEu',17),(18,'evanhardware','$2a$08$eUu.mKn1qe0y4I.J/G1hqOJdSfXlXHKNjKMOzgUk.v8UgMquw9a9e',18);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vote`
--

DROP TABLE IF EXISTS `vote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vote` (
  `vote_id` int(6) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(6) unsigned NOT NULL,
  `name` varchar(20) NOT NULL,
  `description` varchar(50) NOT NULL,
  `expiry_date` datetime NOT NULL,
  `creation_date` datetime NOT NULL,
  PRIMARY KEY (`vote_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `vote_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vote`
--

LOCK TABLES `vote` WRITE;
/*!40000 ALTER TABLE `vote` DISABLE KEYS */;
INSERT INTO `vote` VALUES (6,5,'Test','Test','2016-11-29 20:23:34','2016-11-29 20:13:34'),(7,5,'Test2','Test2','2016-12-02 06:30:32','2016-11-30 14:30:32');
/*!40000 ALTER TABLE `vote` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vote_option`
--

DROP TABLE IF EXISTS `vote_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vote_option` (
  `option_id` int(6) unsigned NOT NULL AUTO_INCREMENT,
  `vote_id` int(6) unsigned NOT NULL,
  `name` varchar(15) NOT NULL,
  PRIMARY KEY (`option_id`),
  KEY `vote_id` (`vote_id`),
  CONSTRAINT `vote_option_ibfk_1` FOREIGN KEY (`vote_id`) REFERENCES `vote` (`vote_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vote_option`
--

LOCK TABLES `vote_option` WRITE;
/*!40000 ALTER TABLE `vote_option` DISABLE KEYS */;
INSERT INTO `vote_option` VALUES (14,6,'Yes'),(15,6,'No'),(16,7,'Cheese'),(17,7,'Fruit'),(18,7,'Bananas');
/*!40000 ALTER TABLE `vote_option` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-11-30 15:01:45
