package Action;

import java.util.Comparator;
import java.util.Random;

import Activation.Activation;
import SpaceHeadingEntity.SpaceHeadingEntity;
import agents.Position;
import behavior.BehaviorTemplate;
import core.Main;

public class Action 
{
	public double reference_value = 0;
	public double extract_property = 0;
	public double offset;
	public int timestep = 0;
	public int type = 0;
	
	public Action()
	{
		
	}
	
	public Action(int t, double extract_p, double o)
	{
		this.type = t;
		this.extract_property = extract_p;
		this.offset = o;
	}
	
}

class desireDirection
{
	int head_start = 0;
	int head_end = 0;
	double distance_to_goal;
	
	public desireDirection(int h_start, int h_end, double dis)
	{
		this.head_start = h_start;
		this.head_end = h_end;
		this.distance_to_goal = dis;
	}
}

class positionDistance
{
	Position position;
	double distance = 0;
	int corner_num = 0;
	
	public positionDistance (Position pos, double d, int corner_n)
	{
		this.position = pos;
		this.distance = d;
		this.corner_num = corner_n;
	}
}

class SortbyDistancetoEntrance implements Comparator<positionDistance>
{
	// Used for sorting in ascending order of
		// roll number
		public int compare(positionDistance a, positionDistance b)
		{
			if (a.distance - b.distance > 0) 
			{
				return 1;
			} 
			else if (a.distance - b.distance < 0)
			{
				return -1;
			} 
			else 
			{
				return 0;
			}
		}
}

class SortbyHeadingAngle implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	// roll number
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.heading - b.heading > 0) 
		{
			return 1;
		} 
		else if (a.heading - b.heading < 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortbyPredictDistanceToEntrance implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	// roll number
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.predict_distance_travel_to_nearest_desire_goal - b.predict_distance_travel_to_nearest_desire_goal > 0) 
		{
			return 1;
		} 
		else if (a.predict_distance_travel_to_nearest_desire_goal - b.predict_distance_travel_to_nearest_desire_goal < 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortbyDistance_Travel implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	// roll number
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_travel - b.distance_travel < 0) 
		{
			return 1;
		} 
		else if (a.distance_travel - b.distance_travel > 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortbyDistance_Angle_to_Desired_Direction implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in ascending order of
	// roll number
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_angle_to_desire_direction - b.distance_angle_to_desire_direction > 0) 
		{
			return 1;
		} 
		else if (a.distance_angle_to_desire_direction - b.distance_angle_to_desire_direction < 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortbyDistance_Angle_to_Current_Direction implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in ascending order of
	// roll number
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_angle_to_current_direction - b.distance_angle_to_current_direction > 0) 
		{
			return 1;
		} 
		else if (a.distance_angle_to_current_direction - b.distance_angle_to_current_direction < 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortbyTravelDistanceToGoalWithinARange implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in ascending order of
	// roll number
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		// Used for sorting in ascending order of
		
		if (a.distance_travel_to_desire_goal - b.distance_travel_to_desire_goal > 0) 
		{
			return 1;
		} 
		else if (a.distance_travel_to_desire_goal - b.distance_travel_to_desire_goal < 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
		
	}
}



class SortbyDensityWithinARange implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in ascending order of
	// roll number
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		// Used for sorting in ascending order of
		
		if (a.entity_density - b.entity_density > 0) 
		{
			return 1;
		} 
		else if (a.entity_density - b.entity_density < 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
		
	}
}

class SortbyScore implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.score - b.score< 0) 
		{
			return 1;
		} 
		else if (a.score - b.score > 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortByDistancetoAgent implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_travel_to_agent - b.distance_travel_to_agent< 0) 
		{
			return 1;
		} 
		else if (a.distance_travel_to_agent - b.distance_travel_to_agent > 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortByDistancetoCircleObstacle implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_travel_to_cir_obs - b.distance_travel_to_cir_obs< 0) 
		{
			return 1;
		} 
		else if (a.distance_travel_to_cir_obs - b.distance_travel_to_cir_obs > 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortByDistancetoRectangleObstacle implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_travel_to_rec_obs - b.distance_travel_to_rec_obs< 0) 
		{
			return 1;
		} 
		else if (a.distance_travel_to_rec_obs - b.distance_travel_to_rec_obs > 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortByDistancetoAllObstacle implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_travel_to_all_obs - b.distance_travel_to_all_obs< 0) 
		{
			return 1;
		} 
		else if (a.distance_travel_to_all_obs - b.distance_travel_to_all_obs > 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}

class SortByDistancetoGoalPoint implements Comparator<SpaceHeadingEntity>
{
	// Used for sorting in decending order of
	public int compare(SpaceHeadingEntity a, SpaceHeadingEntity b)
	{
		if (a.distance_travel_to_goal_points - b.distance_travel_to_goal_points < 0) 
		{
			return 1;
		} 
		else if (a.distance_travel_to_goal_points - b.distance_travel_to_goal_points > 0)
		{
			return -1;
		} 
		else 
		{
			return 0;
		}
	}
}
