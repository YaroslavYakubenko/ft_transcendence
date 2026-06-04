# descpiption of user's model, how user keeping in database(email, username, avatar etc)

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
	def create_user(self, email, password=None, **extra_fields): # ** means to add extra arguments in vocabluary
		if not email:
			raise ValueError('Email is required')
		email = self.normalize_email(email) #converts email to lowercase
		user = self.model(email=email, **extra_fields) # create user in memory
		user.set_password(password) # hashing the password
		user.save() #save in database
		return user

	def create_superuser(self, email, password=None, **extra_fields): # for creating administrator
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
	email = models.EmailField(unique=True) #check '@.' in email, unique means cannot be 2 users with the same email
	username = models.CharField(max_length=50, blank=True) # blank=True means to not nesessary to fill out
	avatar = models.ImageField(upload_to='avatars/', blank=True)
	oauth_avatar = models.URLField(blank=True, default='')
	is_online = models.BooleanField(default=False)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True) # time of registration
	
	# Game statistics
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)
	draws = models.IntegerField(default=0)
	elo = models.IntegerField(default=1200)  # Standard starting ELO rating

	USERNAME_FIELD = 'email' # login via email
	REQUIRED_FIELDS = []

	objects = UserManager() #our manager connects to the model

class Friendship(models.Model):
	
	from_user = models.ForeignKey(User, related_name='friendships_sent', on_delete=models.CASCADE) #related_name means how to approach these friendships
	to_user = models.ForeignKey(User, related_name='friendships_received', on_delete=models.CASCADE) #on_delete means to delete everything

	class Meta:
		unique_together = ('from_user', 'to_user') #coulpe has to be unique, you cannot to add the same user twice

# creates a new database model (a database table) called ChatMessage
# each row will be one message
# Fields: sender, recipient, message, created_at, is_read
class ChatMessage(models.Model):

	# ForeignKey = this field points to another database (here: User)
	# CASCADE = if user is deleted, aslo delete their sent_chat_messages
	sender = models.ForeignKey(				
		User,
		related_name='sent_chat_messages',
		on_delete=models.CASCADE
	)

	recipient = models.ForeignKey(
		User,
		related_name='received_chat_messages',
		on_delete=models.CASCADE
	)

	message = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)		# automatically set this once the message is saved
	is_read = models.BooleanField(default=False)				# boolean is set to false, when a message is created

	#when ChatMessage object is shown as text, show the message text
	def __str__(self):
		return self.message